import { Injectable, BadRequestException, NotFoundException, OnModuleInit, forwardRef, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApprovalsService } from '../approvals/approvals.service';
import { DEFAULT_WORKFLOWS, MODULE_TO_MODEL, DefaultWorkflow } from './default-workflows';

export type TransitionResult =
  | { ok: true; status: string; record: any }
  | { ok: true; pendingApproval: { id: string; toStatus: string }; status: string; record: any };

@Injectable()
export class WorkflowsService implements OnModuleInit {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => ApprovalsService)) private approvals: ApprovalsService,
  ) {}

  async onModuleInit() {
    await this.seedDefaults();
  }

  /** Idempotently create the default workflow rows for any module that has none. */
  async seedDefaults() {
    for (const def of DEFAULT_WORKFLOWS) {
      const existing = await this.prisma.workflow.findUnique({ where: { module: def.module } });
      if (existing) continue;
      await this.installWorkflow(def);
    }
  }

  private async installWorkflow(def: DefaultWorkflow) {
    const wf = await this.prisma.workflow.create({
      data: { module: def.module, name: def.name, description: def.description },
    });
    const stateRows: Record<string, string> = {};
    for (let i = 0; i < def.states.length; i++) {
      const s = def.states[i];
      const row = await this.prisma.workflowState.create({
        data: {
          workflowId: wf.id,
          key: s.key,
          label: s.label,
          color: s.color,
          order: i,
          isInitial: !!s.isInitial,
          isTerminal: !!s.isTerminal,
          requiresApproval: !!s.requiresApproval,
          approverRoleKey: s.approverRoleKey,
          approverGroupKey: s.approverGroupKey,
        },
      });
      stateRows[s.key] = row.id;
    }
    for (const [from, to, label] of def.transitions) {
      const fromId = stateRows[from];
      const toId = stateRows[to];
      if (!fromId || !toId) continue;
      await this.prisma.workflowTransition.create({
        data: { workflowId: wf.id, fromStateId: fromId, toStateId: toId, label },
      });
    }
  }

  async listAll() {
    return this.prisma.workflow.findMany({
      orderBy: { module: 'asc' },
      include: {
        states: { orderBy: { order: 'asc' } },
        transitions: true,
      },
    });
  }

  async get(module: string) {
    const wf = await this.prisma.workflow.findUnique({
      where: { module },
      include: {
        states: { orderBy: { order: 'asc' } },
        transitions: true,
      },
    });
    if (!wf) throw new NotFoundException(`workflow not found: ${module}`);
    return wf;
  }

  /**
   * Replace a workflow's states + transitions in-place. Caller sends the full
   * desired graph; we reset what's stored.
   */
  async update(
    module: string,
    body: {
      name?: string;
      description?: string;
      states: Array<{
        key: string;
        label: string;
        color?: string;
        order?: number;
        isInitial?: boolean;
        isTerminal?: boolean;
        requiresApproval?: boolean;
        approverRoleKey?: string | null;
        approverGroupKey?: string | null;
      }>;
      transitions: Array<{ from: string; to: string; label?: string }>;
    },
  ) {
    const wf = await this.get(module);
    await this.prisma.$transaction(async (tx) => {
      await tx.workflowTransition.deleteMany({ where: { workflowId: wf.id } });
      await tx.workflowState.deleteMany({ where: { workflowId: wf.id } });
      const ids: Record<string, string> = {};
      for (let i = 0; i < body.states.length; i++) {
        const s = body.states[i];
        const row = await tx.workflowState.create({
          data: {
            workflowId: wf.id,
            key: s.key,
            label: s.label,
            color: s.color ?? '#9e9e9e',
            order: s.order ?? i,
            isInitial: !!s.isInitial,
            isTerminal: !!s.isTerminal,
            requiresApproval: !!s.requiresApproval,
            approverRoleKey: s.approverRoleKey || null,
            approverGroupKey: s.approverGroupKey || null,
          },
        });
        ids[s.key] = row.id;
      }
      for (const t of body.transitions) {
        const fromId = ids[t.from];
        const toId = ids[t.to];
        if (!fromId || !toId) continue;
        await tx.workflowTransition.create({
          data: { workflowId: wf.id, fromStateId: fromId, toStateId: toId, label: t.label },
        });
      }
      await tx.workflow.update({
        where: { id: wf.id },
        data: { name: body.name ?? wf.name, description: body.description ?? wf.description },
      });
    });
    return this.get(module);
  }

  /**
   * Apply a status transition. If target requires approval, no status change
   * is made — instead a pending Approval is created with metadata that lets
   * ApprovalsService.decide() complete the transition once approved.
   */
  async transition(
    module: string,
    recordId: string,
    toStatus: string,
    actorId: string,
  ): Promise<TransitionResult> {
    const wf = await this.get(module);
    const modelName = MODULE_TO_MODEL[module];
    if (!modelName) throw new BadRequestException(`unsupported module: ${module}`);
    const model: any = (this.prisma as any)[modelName];
    const record = await model.findUnique({ where: { id: recordId } });
    if (!record) throw new NotFoundException(`${module} ${recordId}`);

    const fromState = wf.states.find((s: any) => s.key === record.status);
    const toState = wf.states.find((s: any) => s.key === toStatus);
    if (!toState) throw new BadRequestException(`unknown target state: ${toStatus}`);

    if (fromState) {
      const allowed = wf.transitions.some(
        (t: any) => t.fromStateId === fromState.id && t.toStateId === toState.id,
      );
      if (!allowed) {
        throw new BadRequestException(`transition ${record.status} → ${toStatus} not allowed`);
      }
    }

    if (record.status === toStatus) {
      return { ok: true, status: record.status, record };
    }

    if (toState.requiresApproval) {
      // Don't change status; create an Approval and embed metadata so the
      // approvals service can complete the transition when granted.
      const existingPending = await this.prisma.approval.findFirst({
        where: { entityType: module, entityId: recordId, status: 'pending' },
      });
      if (existingPending) {
        return {
          ok: true,
          pendingApproval: { id: existingPending.id, toStatus },
          status: record.status,
          record,
        };
      }
      const approverGroupId = await this.resolveGroupId(toState.approverGroupKey);
      const ap = await this.prisma.approval.create({
        data: {
          entityType: module,
          entityId: recordId,
          stepNumber: 1,
          approverGroupId: approverGroupId ?? undefined,
          metadata: JSON.stringify({
            pendingTransition: {
              module,
              recordId,
              toStatus,
              fromStatus: record.status,
              requestedBy: actorId,
            },
            approverRoleKey: toState.approverRoleKey,
            approverGroupKey: toState.approverGroupKey,
          }),
        },
      });
      return {
        ok: true,
        pendingApproval: { id: ap.id, toStatus },
        status: record.status,
        record,
      };
    }

    const updated = await model.update({
      where: { id: recordId },
      data: { status: toStatus },
    });
    return { ok: true, status: toStatus, record: updated };
  }

  /** Called from ApprovalsService when an approval with pendingTransition metadata is approved. */
  async completeApprovedTransition(approvalId: string) {
    const ap = await this.prisma.approval.findUniqueOrThrow({ where: { id: approvalId } });
    if (!ap.metadata) return null;
    let meta: any;
    try { meta = JSON.parse(ap.metadata); } catch { return null; }
    const pt = meta?.pendingTransition;
    if (!pt) return null;
    const modelName = MODULE_TO_MODEL[pt.module];
    if (!modelName) return null;
    const model: any = (this.prisma as any)[modelName];
    return model.update({ where: { id: pt.recordId }, data: { status: pt.toStatus } });
  }

  /** Group lookup by key (returns null if missing). */
  private async resolveGroupId(key?: string | null): Promise<string | null> {
    if (!key) return null;
    const g = await this.prisma.group.findUnique({ where: { key } });
    return g?.id ?? null;
  }

  /** Pending approvals for a given record (optional; UI uses this for badges). */
  async pendingForRecord(module: string, recordId: string) {
    return this.prisma.approval.findMany({
      where: { entityType: module, entityId: recordId, status: 'pending' },
      orderBy: { createdAt: 'desc' },
    });
  }
}
