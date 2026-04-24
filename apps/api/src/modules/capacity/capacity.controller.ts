import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';
import { RequirePermissions } from '../../auth/permissions.decorator';
import { PERMISSIONS } from '@itsm/shared';

@ApiTags('capacity')
@ApiBearerAuth()
@Controller('capacity')
export class CapacityController {
  constructor(private prisma: PrismaService) {}

  @Get('plans') @RequirePermissions(PERMISSIONS.CAP_READ)
  plans() { return this.prisma.capacityPlan.findMany({ include: { thresholds: true } }); }
  @Post('plans') @RequirePermissions(PERMISSIONS.CAP_WRITE)
  createPlan(@Body() body: any) { return this.prisma.capacityPlan.create({ data: body }); }
  @Post('plans/:id/thresholds') @RequirePermissions(PERMISSIONS.CAP_WRITE)
  addThreshold(@Param('id') id: string, @Body() body: any) { return this.prisma.capacityThreshold.create({ data: { ...body, planId: id } }); }

  @Post('metrics') @RequirePermissions(PERMISSIONS.CAP_WRITE)
  ingest(@Body() body: { ciId: string; metric: string; value: number; unit?: string; capturedAt?: string }) {
    return this.prisma.capacityMetric.create({ data: { ...body, capturedAt: body.capturedAt ? new Date(body.capturedAt) : undefined } });
  }

  @Get('metrics') @RequirePermissions(PERMISSIONS.CAP_READ)
  metrics(@Query('ciId') ciId: string, @Query('metric') metric?: string, @Query('hours') hoursStr = '24') {
    const since = new Date(Date.now() - Number(hoursStr) * 3_600_000);
    return this.prisma.capacityMetric.findMany({
      where: { ciId, ...(metric ? { metric } : {}), capturedAt: { gte: since } },
      orderBy: { capturedAt: 'asc' }, take: 5000,
    });
  }

  @Get('forecast') @RequirePermissions(PERMISSIONS.CAP_READ)
  async forecast(@Query('ciId') ciId: string, @Query('metric') metric: string) {
    const since = new Date(Date.now() - 30 * 86_400_000);
    const series = await this.prisma.capacityMetric.findMany({ where: { ciId, metric, capturedAt: { gte: since } }, orderBy: { capturedAt: 'asc' } });
    if (series.length < 2) return { trend: 0, projection30d: null, samples: series.length };
    const xs = series.map((s, i) => i);
    const ys = series.map((s) => s.value);
    const n = xs.length;
    const xbar = xs.reduce((a, b) => a + b, 0) / n;
    const ybar = ys.reduce((a, b) => a + b, 0) / n;
    const num = xs.reduce((s, x, i) => s + (x - xbar) * (ys[i] - ybar), 0);
    const den = xs.reduce((s, x) => s + (x - xbar) ** 2, 0) || 1;
    const slope = num / den;
    const projection30d = ybar + slope * (n + 30 * 24); // assume hourly samples
    return { trend: slope, projection30d, samples: n };
  }
}
