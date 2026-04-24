import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('slm')
@ApiBearerAuth()
@Controller('sla')
export class SlaController {
  constructor(private prisma: PrismaService) {}

  @Get() list() { return this.prisma.sla.findMany({ include: { serviceHours: true, supplier: true } }); }
  @Post() create(@Body() body: any) { return this.prisma.sla.create({ data: body }); }
  @Put(':id') update(@Param('id') id: string, @Body() body: any) { return this.prisma.sla.update({ where: { id }, data: body }); }
  @Delete(':id') remove(@Param('id') id: string) { return this.prisma.sla.delete({ where: { id } }); }

  @Get('timers') timers(@Query('entityType') et?: string, @Query('entityId') eid?: string) {
    return this.prisma.slaTimer.findMany({ where: { entityType: et, entityId: eid }, include: { sla: true } });
  }

  @Get('breaches') breaches() {
    return this.prisma.slaTimer.findMany({ where: { breached: true }, include: { sla: true }, orderBy: { breachedAt: 'desc' }, take: 200 });
  }

  @Get('service-hours') serviceHours() { return this.prisma.serviceHours.findMany({ include: { holidays: true } }); }
  @Post('service-hours') createSh(@Body() body: any) { return this.prisma.serviceHours.create({ data: body }); }
}
