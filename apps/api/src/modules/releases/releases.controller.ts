import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';
import { CounterService } from '../../common/counter.service';
import { RequirePermissions } from '../../auth/permissions.decorator';
import { PERMISSIONS } from '@itsm/shared';

@ApiTags('releases')
@ApiBearerAuth()
@Controller('releases')
export class ReleasesController {
  constructor(private prisma: PrismaService, private counter: CounterService) {}

  @Get() @RequirePermissions(PERMISSIONS.REL_READ)
  list(@Query('status') status?: string) {
    return this.prisma.release.findMany({
      where: status ? { status } : {},
      include: { manager: true, _count: { select: { changes: true, tasks: true } } },
      orderBy: { createdAt: 'desc' }, take: 200,
    });
  }

  @Get(':id') @RequirePermissions(PERMISSIONS.REL_READ)
  get(@Param('id') id: string) {
    return this.prisma.release.findUnique({
      where: { id },
      include: { manager: true, changes: true, tasks: { orderBy: { sequence: 'asc' } }, affectedCis: { include: { ci: true } } },
    });
  }

  @Post() @RequirePermissions(PERMISSIONS.REL_WRITE)
  async create(@Body() body: any) {
    const refNo = await this.counter.next('REL');
    return this.prisma.release.create({ data: { refNo, ...body } });
  }

  @Patch(':id') @RequirePermissions(PERMISSIONS.REL_WRITE)
  update(@Param('id') id: string, @Body() body: any) { return this.prisma.release.update({ where: { id }, data: body }); }

  @Post(':id/tasks') @RequirePermissions(PERMISSIONS.REL_WRITE)
  addTask(@Param('id') id: string, @Body() body: any) {
    return this.prisma.releaseTask.create({ data: { ...body, releaseId: id } });
  }
  @Patch('tasks/:taskId') @RequirePermissions(PERMISSIONS.REL_WRITE)
  updateTask(@Param('taskId') taskId: string, @Body() body: any) {
    return this.prisma.releaseTask.update({ where: { id: taskId }, data: body });
  }

  @Post(':id/changes/:changeId') @RequirePermissions(PERMISSIONS.REL_WRITE)
  attachChange(@Param('id') id: string, @Param('changeId') changeId: string) {
    return this.prisma.changeRequest.update({ where: { id: changeId }, data: { releaseId: id } });
  }
}
