import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';
import { CounterService } from '../../common/counter.service';
import { CurrentUser } from '../../auth/current-user.decorator';
import type { AuthUser } from '../../auth/jwt.strategy';
import { RequirePermissions } from '../../auth/permissions.decorator';
import { PERMISSIONS } from '@itsm/shared';

@ApiTags('problems')
@ApiBearerAuth()
@Controller('problems')
export class ProblemsController {
  constructor(private prisma: PrismaService, private counter: CounterService) {}

  @Get() @RequirePermissions(PERMISSIONS.PRB_READ)
  list(@Query('status') status?: string) {
    return this.prisma.problem.findMany({
      where: status ? { status } : {},
      include: { raisedBy: true, assignee: true, supportGroup: true },
      orderBy: { createdAt: 'desc' }, take: 200,
    });
  }

  @Get(':id') @RequirePermissions(PERMISSIONS.PRB_READ)
  get(@Param('id') id: string) {
    return this.prisma.problem.findUnique({
      where: { id },
      include: { raisedBy: true, assignee: true, supportGroup: true, knownError: true, incidents: true, affectedCis: { include: { ci: true } } },
    });
  }

  @Post() @RequirePermissions(PERMISSIONS.PRB_WRITE)
  async create(@Body() body: any, @CurrentUser() u: AuthUser) {
    const refNo = await this.counter.next('PRB');
    return this.prisma.problem.create({
      data: { refNo, title: body.title, description: body.description, raisedById: u.id, priority: body.priority ?? 'P3', supportGroupId: body.supportGroupId, assigneeId: body.assigneeId },
    });
  }

  @Patch(':id') @RequirePermissions(PERMISSIONS.PRB_WRITE)
  update(@Param('id') id: string, @Body() body: any) { return this.prisma.problem.update({ where: { id }, data: body }); }

  @Post(':id/known-error') @RequirePermissions(PERMISSIONS.PRB_WRITE)
  publishKnownError(@Param('id') id: string, @Body() body: { symptoms: string; cause: string; workaround: string }) {
    return this.prisma.knownError.upsert({
      where: { problemId: id },
      update: { ...body, publishedAt: new Date() },
      create: { problemId: id, ...body, publishedAt: new Date() },
    });
  }

  @Post(':id/link-incident/:incidentId') @RequirePermissions(PERMISSIONS.PRB_WRITE)
  link(@Param('id') id: string, @Param('incidentId') incidentId: string) {
    return this.prisma.incident.update({ where: { id: incidentId }, data: { problemId: id } });
  }
}
