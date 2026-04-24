import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';
import { CounterService } from '../../common/counter.service';
import { RequirePermissions } from '../../auth/permissions.decorator';
import { PERMISSIONS } from '@itsm/shared';
import { CurrentUser } from '../../auth/current-user.decorator';
import type { AuthUser } from '../../auth/jwt.strategy';

@ApiTags('assets')
@ApiBearerAuth()
@Controller('assets')
export class AssetsController {
  constructor(private prisma: PrismaService, private counter: CounterService) {}

  @Get() @RequirePermissions(PERMISSIONS.ASSET_READ)
  list(@Query('q') q?: string, @Query('status') status?: string, @Query('type') type?: string) {
    return this.prisma.asset.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(type ? { type } : {}),
        ...(q ? { OR: [{ name: { contains: q } }, { refNo: { contains: q } }, { serialNumber: { contains: q } }] } : {}),
      },
      include: { owner: true, ci: true, contract: true },
      orderBy: { createdAt: 'desc' }, take: 200,
    });
  }

  @Get(':id') @RequirePermissions(PERMISSIONS.ASSET_READ)
  get(@Param('id') id: string) {
    return this.prisma.asset.findUnique({
      where: { id },
      include: { owner: true, ci: true, contract: true, lifecycleEvents: { orderBy: { occurredAt: 'desc' } }, licenses: true },
    });
  }

  @Post() @RequirePermissions(PERMISSIONS.ASSET_WRITE)
  async create(@Body() body: any, @CurrentUser() u: AuthUser) {
    const refNo = await this.counter.next('ASSET');
    const a = await this.prisma.asset.create({ data: { refNo, ...body } });
    await this.prisma.assetLifecycleEvent.create({ data: { assetId: a.id, type: 'received', actorId: u.id } });
    return a;
  }

  @Patch(':id') @RequirePermissions(PERMISSIONS.ASSET_WRITE)
  update(@Param('id') id: string, @Body() body: any) { return this.prisma.asset.update({ where: { id }, data: body }); }

  @Post(':id/lifecycle') @RequirePermissions(PERMISSIONS.ASSET_WRITE)
  addLifecycle(@Param('id') id: string, @Body() body: { type: string; notes?: string }, @CurrentUser() u: AuthUser) {
    return this.prisma.assetLifecycleEvent.create({ data: { assetId: id, type: body.type, notes: body.notes, actorId: u.id } });
  }

  @Get('licenses/all') @RequirePermissions(PERMISSIONS.ASSET_READ)
  licenses() { return this.prisma.softwareLicense.findMany(); }
  @Post('licenses') @RequirePermissions(PERMISSIONS.ASSET_WRITE)
  createLicense(@Body() body: any) { return this.prisma.softwareLicense.create({ data: body }); }
}
