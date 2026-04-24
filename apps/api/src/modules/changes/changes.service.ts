import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CounterService } from '../../common/counter.service';
import { ApprovalsService } from '../../approvals/approvals.service';
import { PageQuery, paginate, parseSort } from '../../common/pagination';

@Injectable()
export class ChangesService {
  constructor(
    private prisma: PrismaService,
    private counter: CounterService,
    private approvals: ApprovalsService,
  ) {}

  riskScore(input: { impact?: string; urgency?: string; changeType?: string; affectedCiCount?: number }) {
    let score = 0;
    score += { low: 5, medium: 25, high: 50 }[input.impact ?? 'low'] ?? 10;
    score += { low: 5, medium: 20, high: 40, critical: 60 }[input.urgency ?? 'low'] ?? 10;
    score += { standard: 0, normal: 10, emergency: 30 }[input.changeType ?? 'normal'] ?? 10;
    score += Math.min((input.affectedCiCount ?? 0) * 5, 30);
    return Math.min(score, 100);
  }
  riskLevel(score: number) {
    return score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low';
  }

  async create(body: any, raisedById: string) {
    const refNo = await this.counter.next('CHG');
    const score = this.riskScore({ ...body, affectedCiCount: body.ciIds?.length ?? 0 });
    return this.prisma.changeRequest.create({
      data: {
        refNo,
        title: body.title,
        description: body.description,
        changeType: body.changeType ?? 'normal',
        priority: body.priority ?? 'P3',
        riskScore: score,
        riskLevel: this.riskLevel(score),
        raisedById,
        ownerId: body.ownerId,
        supportGroupId: body.supportGroupId,
        plannedStart: body.plannedStart,
        plannedEnd: body.plannedEnd,
        implementationPlan: body.implementationPlan,
        rollbackPlan: body.rollbackPlan,
        testPlan: body.testPlan,
        affectedCis: body.ciIds?.length ? { create: body.ciIds.map((ciId: string) => ({ ciId })) } : undefined,
      },
    });
  }

  async submitForCab(id: string, approvers: { approverId?: string; approverGroupId?: string; dueInHours?: number }[]) {
    if (!approvers.length) throw new BadRequestException('approvers required');
    await this.approvals.createChain('change', id, approvers);
    return this.prisma.changeRequest.update({ where: { id }, data: { status: 'cab_review' } });
  }

  async onApprovalDecision(approvalId: string, decision: 'approved' | 'rejected', actorId: string, comment?: string) {
    const ap = await this.approvals.decide(approvalId, decision, actorId, comment);
    const overall = await this.approvals.overallStatus('change', ap.entityId);
    if (overall === 'approved') {
      await this.prisma.changeRequest.update({ where: { id: ap.entityId }, data: { status: 'approved' } });
    } else if (overall === 'rejected') {
      await this.prisma.changeRequest.update({ where: { id: ap.entityId }, data: { status: 'rejected' } });
    }
    return ap;
  }

  async checkConflicts(plannedStart: Date, plannedEnd: Date) {
    const overlapping = await this.prisma.changeRequest.findMany({
      where: {
        status: { in: ['approved', 'scheduled', 'implementation'] },
        plannedStart: { lte: plannedEnd },
        plannedEnd: { gte: plannedStart },
      },
      select: { id: true, refNo: true, title: true, plannedStart: true, plannedEnd: true, riskLevel: true },
    });
    const freezes = await this.prisma.freezeWindow.findMany({
      where: { startsAt: { lte: plannedEnd }, endsAt: { gte: plannedStart } },
    });
    return { overlapping, freezes };
  }

  async list(q: PageQuery, filters: { status?: string; type?: string }) {
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.type) where.changeType = filters.type;
    if (q.q) where.OR = [{ refNo: { contains: q.q } }, { title: { contains: q.q } }];
    const [total, items] = await Promise.all([
      this.prisma.changeRequest.count({ where }),
      this.prisma.changeRequest.findMany({
        where,
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        orderBy: parseSort(q.sort, ['createdAt', 'plannedStart', 'refNo']),
        include: { raisedBy: true, owner: true, supportGroup: true },
      }),
    ]);
    return paginate(items, total, q);
  }

  get(id: string) {
    return this.prisma.changeRequest.findUnique({
      where: { id },
      include: { raisedBy: true, owner: true, supportGroup: true, release: true, affectedCis: { include: { ci: true } } },
    });
  }
  update(id: string, body: any) { return this.prisma.changeRequest.update({ where: { id }, data: body }); }
}
