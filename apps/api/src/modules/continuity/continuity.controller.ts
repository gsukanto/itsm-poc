import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';
import { RequirePermissions } from '../../auth/permissions.decorator';
import { PERMISSIONS } from '@itsm/shared';

@ApiTags('continuity')
@ApiBearerAuth()
@Controller('continuity')
export class ContinuityController {
  constructor(private prisma: PrismaService) {}

  @Get('plans') @RequirePermissions(PERMISSIONS.CONT_READ)
  plans() { return this.prisma.continuityPlan.findMany({ include: { tests: { orderBy: { scheduledAt: 'desc' }, take: 5 } } }); }
  @Post('plans') @RequirePermissions(PERMISSIONS.CONT_WRITE)
  createPlan(@Body() body: any) { return this.prisma.continuityPlan.create({ data: body }); }
  @Patch('plans/:id') @RequirePermissions(PERMISSIONS.CONT_WRITE)
  updatePlan(@Param('id') id: string, @Body() body: any) { return this.prisma.continuityPlan.update({ where: { id }, data: body }); }

  @Post('plans/:id/tests') @RequirePermissions(PERMISSIONS.CONT_WRITE)
  scheduleTest(@Param('id') id: string, @Body() body: { scheduledAt: string }) {
    return this.prisma.drTest.create({ data: { planId: id, scheduledAt: new Date(body.scheduledAt) } });
  }
  @Patch('tests/:testId') @RequirePermissions(PERMISSIONS.CONT_WRITE)
  recordTest(@Param('testId') testId: string, @Body() body: { result: 'pass' | 'fail' | 'partial'; notes?: string }) {
    return this.prisma.drTest.update({ where: { id: testId }, data: { ...body, executedAt: new Date() } });
  }
}
