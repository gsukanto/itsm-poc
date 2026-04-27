import { Injectable, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { WorkflowsService } from '../workflows/workflows.service';

export interface ApprovalStepDef {
  approverId?: string;
  approverGroupId?: string;
  dueInHours?: number;
}

@Injectable()
export class ApprovalsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    @Inject(forwardRef(() => WorkflowsService)) private workflows: WorkflowsService,
  ) {}

  async createChain(entityType: string, entityId: string, steps: ApprovalStepDef[]) {
    if (!steps || steps.length === 0) return [];
    const data = steps.map((s, i) => ({
      entityType,
      entityId,
      stepNumber: i + 1,
      approverId: s.approverId,
      approverGroupId: s.approverGroupId,
      dueAt: s.dueInHours ? new Date(Date.now() + s.dueInHours * 3600_000) : null,
    }));
    await this.prisma.approval.createMany({ data });
    const approvals = await this.list(entityType, entityId);
    await this.notifyCurrentApprover(entityType, entityId);
    return approvals;
  }

  list(entityType: string, entityId: string) {
    return this.prisma.approval.findMany({
      where: { entityType, entityId },
      orderBy: { stepNumber: 'asc' },
      include: { approver: true },
    });
  }

  listForUser(userId: string) {
    return this.prisma.approval.findMany({
      where: { approverId: userId, status: 'pending' },
      orderBy: { createdAt: 'desc' },
      include: { approver: true },
    });
  }

  async decide(id: string, decision: 'approved' | 'rejected', actorId: string, comment?: string) {
    const ap = await this.prisma.approval.findUniqueOrThrow({ where: { id } });
    if (ap.status !== 'pending') throw new BadRequestException('approval already decided');
    if (ap.approverId && ap.approverId !== actorId) {
      // group-based or delegated approvals could be allowed; for MVP enforce user match if assigned
      throw new BadRequestException('not the assigned approver');
    }
    const updated = await this.prisma.approval.update({
      where: { id },
      data: { status: decision, comment, decidedAt: new Date(), approverId: actorId },
    });
    if (decision === 'approved') {
      // If this approval was created by a workflow transition, complete it now.
      if (ap.metadata && ap.metadata.includes('pendingTransition')) {
        try { await this.workflows.completeApprovedTransition(id); } catch (e: any) {
          // log but don't fail the approval — admin can manually fix the record
          console.error('completeApprovedTransition failed', e?.message);
        }
      }
      await this.notifyCurrentApprover(ap.entityType, ap.entityId);
    }
    return updated;
  }

  private async notifyCurrentApprover(entityType: string, entityId: string) {
    const next = await this.prisma.approval.findFirst({
      where: { entityType, entityId, status: 'pending' },
      orderBy: { stepNumber: 'asc' },
    });
    if (next?.approverId) {
      await this.notifications.enqueue({
        recipientId: next.approverId,
        subject: `Approval needed: ${entityType} ${entityId}`,
        body: `You have a pending approval (step ${next.stepNumber}) for ${entityType} ${entityId}.`,
        entityType,
        entityId,
      });
    }
  }

  async overallStatus(entityType: string, entityId: string): Promise<'pending' | 'approved' | 'rejected' | 'none'> {
    const all = await this.prisma.approval.findMany({ where: { entityType, entityId } });
    if (all.length === 0) return 'none';
    if (all.some((a) => a.status === 'rejected')) return 'rejected';
    if (all.every((a) => a.status === 'approved')) return 'approved';
    return 'pending';
  }
}
