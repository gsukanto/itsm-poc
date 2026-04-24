import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CounterService } from '../../common/counter.service';
import { SlaService } from '../../sla/sla.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { priorityFromUrgencyImpact } from '@itsm/shared';
import { PageQuery, paginate, parseSort } from '../../common/pagination';

@Injectable()
export class IncidentsService {
  constructor(
    private prisma: PrismaService,
    private counter: CounterService,
    private sla: SlaService,
    private notifications: NotificationsService,
  ) {}

  async create(input: any, requesterId: string) {
    const refNo = await this.counter.next('INC');
    const priority = input.priority ?? priorityFromUrgencyImpact(input.urgency ?? 'medium', input.impact ?? 'medium');
    const blank = (v: any) => (v === '' || v === null ? undefined : v);
    const inc = await this.prisma.incident.create({
      data: {
        refNo,
        title: input.title,
        description: input.description,
        priority,
        urgency: input.urgency ?? 'medium',
        impact: input.impact ?? 'medium',
        source: input.source ?? 'portal',
        categoryId: blank(input.categoryId),
        requesterId,
        assigneeId: blank(input.assigneeId),
        supportGroupId: blank(input.supportGroupId),
        affectedCis: input.ciIds?.length
          ? { create: input.ciIds.map((ciId: string) => ({ ciId })) }
          : undefined,
      },
      include: { requester: true, assignee: true, supportGroup: true, affectedCis: { include: { ci: true } } },
    });
    await this.sla.startTimer(`incident-${priority}`, 'incident', inc.id, 'response').catch(() => null);
    await this.sla.startTimer(`incident-${priority}`, 'incident', inc.id, 'resolve').catch(() => null);
    if (inc.assigneeId) {
      await this.notifications.enqueue({
        recipientId: inc.assigneeId,
        subject: `[${refNo}] Assigned: ${inc.title}`,
        body: `Incident ${refNo} (${priority}) was assigned to you.`,
        entityType: 'incident',
        entityId: inc.id,
      });
    }
    return inc;
  }

  async list(q: PageQuery, filters: { status?: string; priority?: string; assigneeId?: string }) {
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.priority) where.priority = filters.priority;
    if (filters.assigneeId) where.assigneeId = filters.assigneeId;
    if (q.q) where.OR = [{ refNo: { contains: q.q } }, { title: { contains: q.q } }];
    const [total, items] = await Promise.all([
      this.prisma.incident.count({ where }),
      this.prisma.incident.findMany({
        where,
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        orderBy: parseSort(q.sort, ['createdAt', 'priority', 'refNo', 'status']),
        include: { requester: true, assignee: true, supportGroup: true },
      }),
    ]);
    return paginate(items, total, q);
  }

  async get(id: string) {
    const inc = await this.prisma.incident.findUnique({
      where: { id },
      include: {
        requester: true, assignee: true, supportGroup: true, problem: true,
        affectedCis: { include: { ci: true } },
      },
    });
    if (!inc) throw new NotFoundException('incident');
    return inc;
  }

  async update(id: string, input: any) {
    const data: any = { ...input };
    if (input.urgency || input.impact) {
      const cur = await this.prisma.incident.findUniqueOrThrow({ where: { id } });
      data.priority = priorityFromUrgencyImpact(input.urgency ?? cur.urgency, input.impact ?? cur.impact);
    }
    delete data.ciIds;
    return this.prisma.incident.update({ where: { id }, data });
  }

  async resolve(id: string, resolution: string, resolutionCode?: string) {
    const inc = await this.prisma.incident.update({
      where: { id },
      data: { status: 'resolved', resolution, resolutionCode, resolvedAt: new Date() },
    });
    await this.sla.stopTimer('incident', id, 'resolve');
    if (inc.requesterId) {
      await this.notifications.enqueue({
        recipientId: inc.requesterId,
        subject: `[${inc.refNo}] Resolved: ${inc.title}`,
        body: `Resolution: ${resolution}`,
        entityType: 'incident',
        entityId: inc.id,
      });
    }
    return inc;
  }

  close(id: string) {
    return this.prisma.incident.update({ where: { id }, data: { status: 'closed', closedAt: new Date() } });
  }

  addWorklog(id: string, body: string, authorId: string, visibility: 'internal' | 'public' = 'internal') {
    return this.prisma.worklog.create({ data: { entityType: 'incident', entityId: id, body, authorId, visibility } });
  }
  worklogs(id: string) {
    return this.prisma.worklog.findMany({ where: { entityType: 'incident', entityId: id }, include: { author: true }, orderBy: { createdAt: 'desc' } });
  }
}
