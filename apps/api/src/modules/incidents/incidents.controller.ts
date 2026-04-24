import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { IncidentsService } from './incidents.service';
import { CurrentUser } from '../../auth/current-user.decorator';
import type { AuthUser } from '../../auth/jwt.strategy';
import { RequirePermissions } from '../../auth/permissions.decorator';
import { PERMISSIONS } from '@itsm/shared';
import { PageQuery } from '../../common/pagination';

@ApiTags('incidents')
@ApiBearerAuth()
@Controller('incidents')
export class IncidentsController {
  constructor(private svc: IncidentsService) {}

  @Get() @RequirePermissions(PERMISSIONS.INC_READ)
  list(@Query() q: PageQuery, @Query('status') status?: string, @Query('priority') priority?: string, @Query('assigneeId') assigneeId?: string) {
    return this.svc.list(q, { status, priority, assigneeId });
  }

  @Get(':id') @RequirePermissions(PERMISSIONS.INC_READ)
  get(@Param('id') id: string) { return this.svc.get(id); }

  @Post() @RequirePermissions(PERMISSIONS.INC_WRITE)
  create(@Body() body: any, @CurrentUser() u: AuthUser) {
    return this.svc.create(body, body.requesterId ?? u.id);
  }

  @Patch(':id') @RequirePermissions(PERMISSIONS.INC_WRITE)
  update(@Param('id') id: string, @Body() body: any) { return this.svc.update(id, body); }

  @Post(':id/resolve') @RequirePermissions(PERMISSIONS.INC_RESOLVE)
  resolve(@Param('id') id: string, @Body() body: { resolution: string; resolutionCode?: string }) {
    return this.svc.resolve(id, body.resolution, body.resolutionCode);
  }

  @Post(':id/close') @RequirePermissions(PERMISSIONS.INC_RESOLVE)
  close(@Param('id') id: string) { return this.svc.close(id); }

  @Post(':id/worklog') @RequirePermissions(PERMISSIONS.INC_WRITE)
  addWorklog(@Param('id') id: string, @Body() body: { body: string; visibility?: 'internal' | 'public' }, @CurrentUser() u: AuthUser) {
    return this.svc.addWorklog(id, body.body, u.id, body.visibility);
  }

  @Get(':id/worklog') @RequirePermissions(PERMISSIONS.INC_READ)
  worklogs(@Param('id') id: string) { return this.svc.worklogs(id); }
}
