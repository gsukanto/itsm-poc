import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';
import { CounterService } from '../../common/counter.service';
import { CurrentUser } from '../../auth/current-user.decorator';
import type { AuthUser } from '../../auth/jwt.strategy';
import { RequirePermissions } from '../../auth/permissions.decorator';
import { PERMISSIONS } from '@itsm/shared';

@ApiTags('knowledge')
@ApiBearerAuth()
@Controller('knowledge')
export class KnowledgeController {
  constructor(private prisma: PrismaService, private counter: CounterService) {}

  @Get() @RequirePermissions(PERMISSIONS.KB_READ)
  list(@Query('q') q?: string, @Query('status') status: string = 'published') {
    return this.prisma.kbArticle.findMany({
      where: {
        status,
        ...(q ? { OR: [{ title: { contains: q } }, { body: { contains: q } }] } : {}),
      },
      orderBy: { updatedAt: 'desc' }, take: 100,
    });
  }

  @Get(':id') @RequirePermissions(PERMISSIONS.KB_READ)
  async get(@Param('id') id: string) {
    const a = await this.prisma.kbArticle.update({
      where: { id }, data: { views: { increment: 1 } },
      include: { author: true, versions: { orderBy: { version: 'desc' }, take: 5 } },
    });
    return a;
  }

  @Post() @RequirePermissions(PERMISSIONS.KB_WRITE)
  async create(@Body() body: any, @CurrentUser() u: AuthUser) {
    const refNo = await this.counter.next('KB');
    const a = await this.prisma.kbArticle.create({
      data: {
        refNo, title: body.title, body: body.body, category: body.category,
        tags: body.tags ? JSON.stringify(body.tags) : undefined,
        authorId: u.id,
      },
    });
    await this.prisma.kbArticleVersion.create({
      data: { articleId: a.id, version: 1, title: a.title, body: a.body, createdById: u.id },
    });
    return a;
  }

  @Patch(':id') @RequirePermissions(PERMISSIONS.KB_WRITE)
  async update(@Param('id') id: string, @Body() body: any, @CurrentUser() u: AuthUser) {
    const cur = await this.prisma.kbArticle.findUniqueOrThrow({ where: { id } });
    const lastVer = await this.prisma.kbArticleVersion.findFirst({ where: { articleId: id }, orderBy: { version: 'desc' } });
    const nextVer = (lastVer?.version ?? 0) + 1;
    const a = await this.prisma.kbArticle.update({
      where: { id },
      data: { title: body.title ?? cur.title, body: body.body ?? cur.body, category: body.category ?? cur.category, tags: body.tags ? JSON.stringify(body.tags) : cur.tags },
    });
    await this.prisma.kbArticleVersion.create({
      data: { articleId: id, version: nextVer, title: a.title, body: a.body, createdById: u.id },
    });
    return a;
  }

  @Post(':id/publish') @RequirePermissions(PERMISSIONS.KB_PUBLISH)
  publish(@Param('id') id: string) {
    return this.prisma.kbArticle.update({ where: { id }, data: { status: 'published', publishedAt: new Date() } });
  }
  @Post(':id/retire') @RequirePermissions(PERMISSIONS.KB_PUBLISH)
  retire(@Param('id') id: string) { return this.prisma.kbArticle.update({ where: { id }, data: { status: 'retired' } }); }

  @Post(':id/feedback') @RequirePermissions(PERMISSIONS.KB_READ)
  async feedback(@Param('id') id: string, @Body() body: { helpful: boolean; comment?: string }, @CurrentUser() u: AuthUser) {
    await this.prisma.kbFeedback.create({ data: { articleId: id, helpful: body.helpful, comment: body.comment, userId: u.id } });
    return this.prisma.kbArticle.update({
      where: { id },
      data: body.helpful ? { helpful: { increment: 1 } } : { notHelpful: { increment: 1 } },
    });
  }
}
