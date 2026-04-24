import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface DaySchedule { day: number; start: string; end: string; }

@Injectable()
export class SlaService {
  private readonly log = new Logger(SlaService.name);
  constructor(private prisma: PrismaService) {}

  // Compute due date from start by adding businessMinutes within a given ServiceHours definition.
  async computeDue(startedAt: Date, businessMinutes: number, serviceHoursId?: string | null): Promise<Date> {
    if (!serviceHoursId) return new Date(startedAt.getTime() + businessMinutes * 60_000);
    const sh = await this.prisma.serviceHours.findUnique({
      where: { id: serviceHoursId },
      include: { holidays: true },
    });
    if (!sh) return new Date(startedAt.getTime() + businessMinutes * 60_000);
    const schedule: DaySchedule[] = JSON.parse(sh.schedule);
    const holidays = new Set(sh.holidays.map((h) => h.date.toISOString().slice(0, 10)));

    let remaining = businessMinutes;
    let cur = new Date(startedAt);
    while (remaining > 0) {
      const dayKey = cur.toISOString().slice(0, 10);
      const dow = cur.getUTCDay();
      const day = schedule.find((d) => d.day === dow);
      if (!day || holidays.has(dayKey)) {
        cur = nextMidnight(cur);
        continue;
      }
      const start = parseHM(day.start, cur);
      const end = parseHM(day.end, cur);
      if (cur < start) cur = start;
      if (cur >= end) {
        cur = nextMidnight(cur);
        continue;
      }
      const availMin = Math.floor((end.getTime() - cur.getTime()) / 60_000);
      if (availMin >= remaining) {
        cur = new Date(cur.getTime() + remaining * 60_000);
        remaining = 0;
      } else {
        remaining -= availMin;
        cur = nextMidnight(cur);
      }
    }
    return cur;
  }

  async startTimer(slaKey: string, entityType: string, entityId: string, metric: 'response' | 'resolve') {
    const sla = await this.prisma.sla.findUnique({ where: { key: slaKey } });
    if (!sla) return null;
    const minutes = metric === 'response' ? sla.responseMins : sla.resolveMins;
    if (!minutes) return null;
    const startedAt = new Date();
    const dueAt = await this.computeDue(startedAt, minutes, sla.serviceHoursId);
    return this.prisma.slaTimer.create({
      data: { slaId: sla.id, entityType, entityId, metric, startedAt, dueAt },
    });
  }

  async stopTimer(entityType: string, entityId: string, metric: 'response' | 'resolve') {
    const t = await this.prisma.slaTimer.findFirst({
      where: { entityType, entityId, metric, metAt: null },
    });
    if (!t) return null;
    return this.prisma.slaTimer.update({
      where: { id: t.id },
      data: { metAt: new Date() },
    });
  }

  async checkBreaches(): Promise<number> {
    const now = new Date();
    const due = await this.prisma.slaTimer.findMany({
      where: { metAt: null, breached: false, dueAt: { lte: now } },
    });
    if (due.length) {
      await this.prisma.slaTimer.updateMany({
        where: { id: { in: due.map((t) => t.id) } },
        data: { breached: true, breachedAt: now },
      });
      this.log.warn(`SLA breaches: ${due.length}`);
    }
    return due.length;
  }
}

function parseHM(hm: string, ref: Date): Date {
  const [h, m] = hm.split(':').map((s) => Number(s));
  const d = new Date(ref);
  d.setUTCHours(h, m, 0, 0);
  return d;
}
function nextMidnight(ref: Date): Date {
  const d = new Date(ref);
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + 1);
  return d;
}
