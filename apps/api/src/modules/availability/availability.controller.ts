import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';
import { RequirePermissions } from '../../auth/permissions.decorator';
import { PERMISSIONS } from '@itsm/shared';

@ApiTags('availability')
@ApiBearerAuth()
@Controller('availability')
export class AvailabilityController {
  constructor(private prisma: PrismaService) {}

  @Get('plans') @RequirePermissions(PERMISSIONS.AVAIL_READ)
  plans() { return this.prisma.availabilityPlan.findMany(); }
  @Post('plans') @RequirePermissions(PERMISSIONS.AVAIL_WRITE)
  createPlan(@Body() body: any) { return this.prisma.availabilityPlan.create({ data: body }); }
  @Patch('plans/:id') @RequirePermissions(PERMISSIONS.AVAIL_WRITE)
  updatePlan(@Param('id') id: string, @Body() body: any) { return this.prisma.availabilityPlan.update({ where: { id }, data: body }); }

  @Get('outages') @RequirePermissions(PERMISSIONS.AVAIL_READ)
  outages(@Query('serviceKey') serviceKey?: string) {
    return this.prisma.outageRecord.findMany({ where: serviceKey ? { serviceKey } : {}, orderBy: { startedAt: 'desc' }, take: 200 });
  }
  @Post('outages') @RequirePermissions(PERMISSIONS.AVAIL_WRITE)
  createOutage(@Body() body: any) { return this.prisma.outageRecord.create({ data: body }); }
  @Patch('outages/:id') @RequirePermissions(PERMISSIONS.AVAIL_WRITE)
  updateOutage(@Param('id') id: string, @Body() body: any) { return this.prisma.outageRecord.update({ where: { id }, data: body }); }

  @Get('uptime') @RequirePermissions(PERMISSIONS.AVAIL_READ)
  async uptime(@Query('serviceKey') serviceKey: string, @Query('windowDays') windowDaysStr = '30') {
    const days = Number(windowDaysStr);
    const since = new Date(Date.now() - days * 86_400_000);
    const outages = await this.prisma.outageRecord.findMany({ where: { serviceKey, startedAt: { gte: since } } });
    const downMs = outages.reduce((sum, o) => sum + ((o.endedAt ?? new Date()).getTime() - o.startedAt.getTime()), 0);
    const totalMs = days * 86_400_000;
    const uptimePct = ((totalMs - downMs) / totalMs) * 100;
    return { serviceKey, days, downMs, uptimePct: Number(uptimePct.toFixed(4)), outages: outages.length };
  }
}
