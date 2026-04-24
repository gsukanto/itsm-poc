import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RequirePermissions } from '../../auth/permissions.decorator';
import { PERMISSIONS } from '@itsm/shared';

@ApiTags('events')
@ApiBearerAuth()
@Controller('events')
export class EventsController {
  constructor(private svc: EventsService, private prisma: PrismaService) {}

  @Post('ingest') @RequirePermissions(PERMISSIONS.EVT_INGEST)
  ingest(@Body() body: any) { return this.svc.ingest(body); }

  @Get() @RequirePermissions(PERMISSIONS.EVT_READ)
  list(@Query('severity') severity?: string, @Query('status') status?: string) { return this.svc.list({ severity, status }); }

  @Patch(':id/acknowledge') @RequirePermissions(PERMISSIONS.EVT_WRITE)
  ack(@Param('id') id: string) { return this.prisma.eventRecord.update({ where: { id }, data: { status: 'acknowledged', acknowledgedAt: new Date() } }); }
  @Patch(':id/close') @RequirePermissions(PERMISSIONS.EVT_WRITE)
  close(@Param('id') id: string) { return this.prisma.eventRecord.update({ where: { id }, data: { status: 'closed', closedAt: new Date() } }); }

  @Get('rules') @RequirePermissions(PERMISSIONS.EVT_READ)
  rules() { return this.prisma.eventRule.findMany({ include: { source: true } }); }
  @Post('rules') @RequirePermissions(PERMISSIONS.EVT_WRITE)
  createRule(@Body() body: any) { return this.prisma.eventRule.create({ data: body }); }
  @Patch('rules/:id') @RequirePermissions(PERMISSIONS.EVT_WRITE)
  updateRule(@Param('id') id: string, @Body() body: any) { return this.prisma.eventRule.update({ where: { id }, data: body }); }

  @Get('sources') @RequirePermissions(PERMISSIONS.EVT_READ)
  sources() { return this.prisma.eventSource.findMany(); }
  @Post('sources') @RequirePermissions(PERMISSIONS.EVT_WRITE)
  createSource(@Body() body: any) { return this.prisma.eventSource.create({ data: body }); }
}
