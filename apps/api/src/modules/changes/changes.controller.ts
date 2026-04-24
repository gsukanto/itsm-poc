import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ChangesService } from './changes.service';
import { CurrentUser } from '../../auth/current-user.decorator';
import type { AuthUser } from '../../auth/jwt.strategy';
import { PrismaService } from '../../prisma/prisma.service';
import { RequirePermissions } from '../../auth/permissions.decorator';
import { PERMISSIONS } from '@itsm/shared';
import { PageQuery } from '../../common/pagination';

@ApiTags('changes')
@ApiBearerAuth()
@Controller('changes')
export class ChangesController {
  constructor(private svc: ChangesService, private prisma: PrismaService) {}

  @Get() @RequirePermissions(PERMISSIONS.CHG_READ)
  list(@Query() q: PageQuery, @Query('status') status?: string, @Query('type') type?: string) { return this.svc.list(q, { status, type }); }

  @Get('calendar') @RequirePermissions(PERMISSIONS.CHG_READ)
  calendar(@Query('from') from: string, @Query('to') to: string) {
    return this.prisma.changeRequest.findMany({
      where: { plannedStart: { gte: new Date(from) }, plannedEnd: { lte: new Date(to) } },
      select: { id: true, refNo: true, title: true, plannedStart: true, plannedEnd: true, status: true, riskLevel: true, changeType: true },
    });
  }

  @Post('check-conflicts') @RequirePermissions(PERMISSIONS.CHG_READ)
  checkConflicts(@Body() body: { plannedStart: string; plannedEnd: string }) {
    return this.svc.checkConflicts(new Date(body.plannedStart), new Date(body.plannedEnd));
  }

  @Get(':id') @RequirePermissions(PERMISSIONS.CHG_READ)
  get(@Param('id') id: string) { return this.svc.get(id); }

  @Post() @RequirePermissions(PERMISSIONS.CHG_WRITE)
  create(@Body() body: any, @CurrentUser() u: AuthUser) { return this.svc.create(body, u.id); }

  @Patch(':id') @RequirePermissions(PERMISSIONS.CHG_WRITE)
  update(@Param('id') id: string, @Body() body: any) { return this.svc.update(id, body); }

  @Post(':id/submit-cab') @RequirePermissions(PERMISSIONS.CHG_WRITE)
  submitCab(@Param('id') id: string, @Body() body: { approvers: any[] }) { return this.svc.submitForCab(id, body.approvers); }

  @Post('approvals/:id/approve') @RequirePermissions(PERMISSIONS.CHG_APPROVE)
  approve(@Param('id') id: string, @Body() body: { comment?: string }, @CurrentUser() u: AuthUser) {
    return this.svc.onApprovalDecision(id, 'approved', u.id, body?.comment);
  }
  @Post('approvals/:id/reject') @RequirePermissions(PERMISSIONS.CHG_APPROVE)
  reject(@Param('id') id: string, @Body() body: { comment?: string }, @CurrentUser() u: AuthUser) {
    return this.svc.onApprovalDecision(id, 'rejected', u.id, body?.comment);
  }

  @Get('freeze-windows/all') @RequirePermissions(PERMISSIONS.CHG_READ)
  listFreezes() { return this.prisma.freezeWindow.findMany({ orderBy: { startsAt: 'asc' } }); }
  @Post('freeze-windows') @RequirePermissions(PERMISSIONS.CHG_WRITE)
  createFreeze(@Body() body: any) { return this.prisma.freezeWindow.create({ data: body }); }
}
