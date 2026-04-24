import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AttachmentsService } from './attachments.service';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/jwt.strategy';

@ApiTags('attachments')
@ApiBearerAuth()
@Controller('attachments')
export class AttachmentsController {
  constructor(private svc: AttachmentsService) {}

  @Get()
  list(@Query('entityType') entityType: string, @Query('entityId') entityId: string) {
    return this.svc.list(entityType, entityId);
  }

  @Post('upload-url')
  uploadUrl(@Body() body: { entityType: string; entityId: string; fileName: string; contentType: string; sizeBytes: number }, @CurrentUser() user: AuthUser) {
    return this.svc.createUploadUrl(body.entityType, body.entityId, body.fileName, body.contentType, body.sizeBytes, user?.id);
  }

  @Get(':id/download-url')
  downloadUrl(@Param('id') id: string) {
    return this.svc.createDownloadUrl(id);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.svc.delete(id);
  }
}
