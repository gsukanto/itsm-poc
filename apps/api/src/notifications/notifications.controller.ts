import { Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/jwt.strategy';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private svc: NotificationsService) {}
  @Get('me') me(@CurrentUser() u: AuthUser) { return this.svc.listForUser(u.id); }
  @Patch(':id/read') read(@Param('id') id: string) { return this.svc.markRead(id); }
}
