import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { WorkflowsService } from './workflows.service';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/jwt.strategy';

@ApiTags('workflows')
@ApiBearerAuth()
@Controller('workflows')
export class WorkflowsController {
  constructor(private svc: WorkflowsService) {}

  @Get()
  list() {
    return this.svc.listAll();
  }

  @Get(':module')
  get(@Param('module') module: string) {
    return this.svc.get(module);
  }

  @Put(':module')
  update(@Param('module') module: string, @Body() body: any) {
    return this.svc.update(module, body);
  }

  @Post(':module/:id/transition')
  transition(
    @Param('module') module: string,
    @Param('id') id: string,
    @Body() body: { toStatus: string },
    @CurrentUser() u: AuthUser,
  ) {
    return this.svc.transition(module, id, body.toStatus, u.id);
  }

  @Get(':module/:id/pending-approvals')
  pending(@Param('module') module: string, @Param('id') id: string) {
    return this.svc.pendingForRecord(module, id);
  }
}
