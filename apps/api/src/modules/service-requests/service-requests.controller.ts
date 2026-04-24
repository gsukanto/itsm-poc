import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ServiceRequestsService } from './service-requests.service';
import { CurrentUser } from '../../auth/current-user.decorator';
import type { AuthUser } from '../../auth/jwt.strategy';
import { RequirePermissions } from '../../auth/permissions.decorator';
import { PERMISSIONS } from '@itsm/shared';
import { PageQuery } from '../../common/pagination';

@ApiTags('service-requests')
@ApiBearerAuth()
@Controller('service-requests')
export class ServiceRequestsController {
  constructor(private svc: ServiceRequestsService) {}

  @Get() @RequirePermissions(PERMISSIONS.SR_READ)
  list(@Query() q: PageQuery, @Query('status') status?: string) { return this.svc.list(q, { status }); }

  @Get(':id') @RequirePermissions(PERMISSIONS.SR_READ)
  get(@Param('id') id: string) { return this.svc.get(id); }

  @Post() @RequirePermissions(PERMISSIONS.SR_WRITE)
  create(@Body() body: any, @CurrentUser() u: AuthUser) { return this.svc.create(body, body.requesterId ?? u.id); }

  @Patch(':id') @RequirePermissions(PERMISSIONS.SR_WRITE)
  update(@Param('id') id: string, @Body() body: any) { return this.svc.update(id, body); }

  @Post('approvals/:id/approve')
  approve(@Param('id') id: string, @Body() body: { comment?: string }, @CurrentUser() u: AuthUser) {
    return this.svc.approveStep(id, u.id, body?.comment);
  }
  @Post('approvals/:id/reject')
  reject(@Param('id') id: string, @Body() body: { comment?: string }, @CurrentUser() u: AuthUser) {
    return this.svc.rejectStep(id, u.id, body?.comment);
  }

  @Patch('tasks/:taskId/complete') @RequirePermissions(PERMISSIONS.SR_FULFIL)
  complete(@Param('taskId') taskId: string) { return this.svc.completeTask(taskId); }
}
