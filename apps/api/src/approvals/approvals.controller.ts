import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ApprovalsService } from './approvals.service';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/jwt.strategy';

@ApiTags('approvals')
@ApiBearerAuth()
@Controller('approvals')
export class ApprovalsController {
  constructor(private svc: ApprovalsService) {}

  @Get()
  list(@Query('entityType') entityType: string, @Query('entityId') entityId: string) {
    return this.svc.list(entityType, entityId);
  }

  @Get('mine')
  mine(@CurrentUser() u: AuthUser) {
    return this.svc.listForUser(u.id);
  }

  @Post(':id/decide')
  decide(@Param('id') id: string, @Body() body: { decision: 'approved' | 'rejected'; comment?: string }, @CurrentUser() u: AuthUser) {
    return this.svc.decide(id, body.decision, u.id, body?.comment);
  }

  @Patch(':id/approve')
  approve(@Param('id') id: string, @Body() body: { comment?: string }, @CurrentUser() u: AuthUser) {
    return this.svc.decide(id, 'approved', u.id, body?.comment);
  }

  @Patch(':id/reject')
  reject(@Param('id') id: string, @Body() body: { comment?: string }, @CurrentUser() u: AuthUser) {
    return this.svc.decide(id, 'rejected', u.id, body?.comment);
  }
}
