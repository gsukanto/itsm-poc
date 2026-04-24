import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CounterService } from '../../common/counter.service';
import { ApprovalsService } from '../../approvals/approvals.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { PageQuery, paginate, parseSort } from '../../common/pagination';

@Injectable()
export class ServiceRequestsService {
  constructor(
    private prisma: PrismaService,
    private counter: CounterService,
    private approvals: ApprovalsService,
    private notifications: NotificationsService,
  ) {}

  async create(body: any, requesterId: string) {
    const refNo = await this.counter.next('SR');
    const item = body.catalogItemId
      ? await this.prisma.catalogItem.findUnique({ where: { id: body.catalogItemId } })
      : null;
    const sr = await this.prisma.serviceRequest.create({
      data: {
        refNo,
        title: body.title ?? item?.name ?? 'Service Request',
        catalogItemId: body.catalogItemId,
        formData: body.formData ? JSON.stringify(body.formData) : undefined,
        requesterId,
        priority: body.priority ?? 'P3',
      },
    });

    // Build approval chain from item.approvalSchema (JSON array of steps)
    let approvalSteps: any[] = [];
    if (item?.approvalSchema) {
      try { approvalSteps = JSON.parse(item.approvalSchema); } catch { /* ignore */ }
    }
    if (approvalSteps.length) {
      await this.approvals.createChain('service_request', sr.id, approvalSteps);
      await this.prisma.serviceRequest.update({ where: { id: sr.id }, data: { status: 'approval_pending' } });
    }

    // Build fulfilment tasks from item.fulfilmentSchema (JSON array)
    if (item?.fulfilmentSchema) {
      try {
        const tasks = JSON.parse(item.fulfilmentSchema) as any[];
        await this.prisma.fulfilmentTask.createMany({
          data: tasks.map((t, i) => ({
            requestId: sr.id, sequence: i + 1, title: t.title, description: t.description, groupId: t.groupId,
          })),
        });
      } catch { /* ignore */ }
    }
    return this.get(sr.id);
  }

  async approveStep(approvalId: string, actorId: string, comment?: string) {
    const ap = await this.approvals.decide(approvalId, 'approved', actorId, comment);
    const status = await this.approvals.overallStatus('service_request', ap.entityId);
    if (status === 'approved') {
      await this.prisma.serviceRequest.update({ where: { id: ap.entityId }, data: { status: 'fulfilment' } });
    }
    return ap;
  }

  async rejectStep(approvalId: string, actorId: string, comment?: string) {
    const ap = await this.approvals.decide(approvalId, 'rejected', actorId, comment);
    await this.prisma.serviceRequest.update({ where: { id: ap.entityId }, data: { status: 'rejected' } });
    return ap;
  }

  async list(q: PageQuery, filters: { status?: string }) {
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (q.q) where.OR = [{ refNo: { contains: q.q } }, { title: { contains: q.q } }];
    const [total, items] = await Promise.all([
      this.prisma.serviceRequest.count({ where }),
      this.prisma.serviceRequest.findMany({
        where,
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        orderBy: parseSort(q.sort, ['createdAt', 'priority', 'refNo', 'status']),
        include: { catalogItem: true, requester: true, assignee: true, supportGroup: true },
      }),
    ]);
    return paginate(items, total, q);
  }

  get(id: string) {
    return this.prisma.serviceRequest.findUnique({
      where: { id },
      include: { catalogItem: true, requester: true, assignee: true, supportGroup: true, tasks: true },
    });
  }

  update(id: string, body: any) { return this.prisma.serviceRequest.update({ where: { id }, data: body }); }

  async completeTask(taskId: string) {
    const t = await this.prisma.fulfilmentTask.update({ where: { id: taskId }, data: { status: 'done', completedAt: new Date() } });
    const remaining = await this.prisma.fulfilmentTask.count({ where: { requestId: t.requestId, status: { not: 'done' } } });
    if (remaining === 0) {
      await this.prisma.serviceRequest.update({ where: { id: t.requestId }, data: { status: 'resolved', resolvedAt: new Date() } });
    }
    return t;
  }
}
