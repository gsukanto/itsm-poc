import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('dashboards')
@ApiBearerAuth()
@Controller('dashboards')
export class DashboardsController {
  constructor(private prisma: PrismaService) {}

  @Get('overview')
  async overview() {
    const [openIncidents, criticalIncidents, openSrs, pendingApprovals, openChanges, openProblems, breachedSlas, openEvents] = await Promise.all([
      this.prisma.incident.count({ where: { status: { notIn: ['resolved', 'closed', 'cancelled'] } } }),
      this.prisma.incident.count({ where: { priority: 'P1', status: { notIn: ['resolved', 'closed', 'cancelled'] } } }),
      this.prisma.serviceRequest.count({ where: { status: { notIn: ['resolved', 'closed', 'cancelled', 'rejected'] } } }),
      this.prisma.approval.count({ where: { status: 'pending' } }),
      this.prisma.changeRequest.count({ where: { status: { notIn: ['closed', 'cancelled', 'rejected'] } } }),
      this.prisma.problem.count({ where: { status: { notIn: ['closed', 'resolved'] } } }),
      this.prisma.slaTimer.count({ where: { breached: true, metAt: null } }),
      this.prisma.eventRecord.count({ where: { status: 'open' } }),
    ]);
    return { openIncidents, criticalIncidents, openSrs, pendingApprovals, openChanges, openProblems, breachedSlas, openEvents };
  }

  @Get('incidents-by-priority')
  async incidentsByPriority() {
    const grouped = await this.prisma.incident.groupBy({ by: ['priority'], _count: { _all: true }, where: { status: { notIn: ['resolved', 'closed', 'cancelled'] } } });
    return grouped.map((g) => ({ priority: g.priority, count: g._count._all }));
  }

  @Get('changes-by-status')
  async changesByStatus() {
    const grouped = await this.prisma.changeRequest.groupBy({ by: ['status'], _count: { _all: true } });
    return grouped.map((g) => ({ status: g.status, count: g._count._all }));
  }
}
