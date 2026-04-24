import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CounterService } from '../../common/counter.service';

interface IngestInput {
  sourceKey: string;
  externalId?: string;
  severity?: string;
  message: string;
  payload?: any;
  ciId?: string;
  correlationKey?: string;
  occurredAt?: string;
}

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService, private counter: CounterService) {}

  async ingest(input: IngestInput) {
    const source = await this.prisma.eventSource.upsert({
      where: { key: input.sourceKey },
      update: {},
      create: { key: input.sourceKey, name: input.sourceKey, type: 'webhook' },
    });
    const ev = await this.prisma.eventRecord.create({
      data: {
        sourceId: source.id,
        externalId: input.externalId,
        severity: input.severity ?? 'info',
        message: input.message,
        payload: input.payload ? JSON.stringify(input.payload) : undefined,
        ciId: input.ciId,
        correlationKey: input.correlationKey,
        occurredAt: input.occurredAt ? new Date(input.occurredAt) : new Date(),
      },
    });
    await this.applyRules(ev.id);
    return ev;
  }

  private async applyRules(eventId: string) {
    const ev = await this.prisma.eventRecord.findUniqueOrThrow({ where: { id: eventId } });
    const rules = await this.prisma.eventRule.findMany({
      where: { isActive: true, OR: [{ sourceId: ev.sourceId }, { sourceId: null }] },
      orderBy: { priority: 'asc' },
    });
    for (const rule of rules) {
      let match: any;
      try { match = JSON.parse(rule.matchExpr); } catch { continue; }
      if (this.matches(ev, match)) {
        if (rule.action === 'create_incident' && (ev.severity === 'critical' || ev.severity === 'major')) {
          const refNo = await this.counter.next('INC');
          const inc = await this.prisma.incident.create({
            data: {
              refNo,
              title: `[Auto] ${ev.message.slice(0, 200)}`,
              description: ev.message,
              priority: ev.severity === 'critical' ? 'P1' : 'P2',
              urgency: ev.severity === 'critical' ? 'critical' : 'high',
              impact: 'high',
              source: 'event',
              requesterId: await this.systemUserId(),
              affectedCis: ev.ciId ? { create: [{ ciId: ev.ciId }] } : undefined,
            },
          });
          await this.prisma.eventRecord.update({ where: { id: ev.id }, data: { incidentId: inc.id } });
        } else if (rule.action === 'suppress') {
          await this.prisma.eventRecord.update({ where: { id: ev.id }, data: { status: 'suppressed' } });
        }
      }
    }
  }

  private matches(ev: any, match: any): boolean {
    if (match.severity && ev.severity !== match.severity) return false;
    if (match.severityIn && !match.severityIn.includes(ev.severity)) return false;
    if (match.messageContains && !ev.message.includes(match.messageContains)) return false;
    if (match.ciId && ev.ciId !== match.ciId) return false;
    return true;
  }

  private async systemUserId(): Promise<string> {
    const u = await this.prisma.user.upsert({
      where: { email: 'system@itsm.local' },
      update: {},
      create: { email: 'system@itsm.local', displayName: 'System' },
    });
    return u.id;
  }

  list(filters: { severity?: string; status?: string }) {
    return this.prisma.eventRecord.findMany({
      where: { ...(filters.severity ? { severity: filters.severity } : {}), ...(filters.status ? { status: filters.status } : {}) },
      include: { source: true, ci: true },
      orderBy: { occurredAt: 'desc' }, take: 200,
    });
  }
}
