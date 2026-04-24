import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';
import { CounterService } from '../../common/counter.service';
import { RequirePermissions } from '../../auth/permissions.decorator';
import { PERMISSIONS } from '@itsm/shared';

@ApiTags('cmdb')
@ApiBearerAuth()
@Controller('cmdb')
export class CmdbController {
  constructor(private prisma: PrismaService, private counter: CounterService) {}

  @Get('ci-types') @RequirePermissions(PERMISSIONS.CMDB_READ)
  listTypes() { return this.prisma.ciType.findMany({ include: { children: true } }); }
  @Post('ci-types') @RequirePermissions(PERMISSIONS.CMDB_WRITE)
  createType(@Body() body: any) { return this.prisma.ciType.create({ data: body }); }

  @Get('cis') @RequirePermissions(PERMISSIONS.CMDB_READ)
  listCis(@Query('q') q?: string, @Query('typeId') typeId?: string, @Query('status') status?: string) {
    return this.prisma.configurationItem.findMany({
      where: {
        ...(typeId ? { ciTypeId: typeId } : {}),
        ...(status ? { status } : {}),
        ...(q ? { OR: [{ name: { contains: q } }, { refNo: { contains: q } }] } : {}),
      },
      include: { ciType: true },
      orderBy: { name: 'asc' }, take: 500,
    });
  }

  @Get('cis/:id') @RequirePermissions(PERMISSIONS.CMDB_READ)
  getCi(@Param('id') id: string) {
    return this.prisma.configurationItem.findUnique({
      where: { id },
      include: {
        ciType: true,
        outgoingRels: { include: { target: true } },
        incomingRels: { include: { source: true } },
        baselines: true, asset: true,
      },
    });
  }

  @Post('cis') @RequirePermissions(PERMISSIONS.CMDB_WRITE)
  async createCi(@Body() body: any) {
    const refNo = await this.counter.next('CI');
    return this.prisma.configurationItem.create({ data: { refNo, ...body } });
  }
  @Patch('cis/:id') @RequirePermissions(PERMISSIONS.CMDB_WRITE)
  updateCi(@Param('id') id: string, @Body() body: any) { return this.prisma.configurationItem.update({ where: { id }, data: body }); }
  @Delete('cis/:id') @RequirePermissions(PERMISSIONS.CMDB_WRITE)
  removeCi(@Param('id') id: string) { return this.prisma.configurationItem.update({ where: { id }, data: { status: 'retired' } }); }

  @Post('relationships') @RequirePermissions(PERMISSIONS.CMDB_WRITE)
  createRel(@Body() body: { sourceId: string; targetId: string; type: string }) { return this.prisma.ciRelationship.create({ data: body }); }
  @Delete('relationships/:id') @RequirePermissions(PERMISSIONS.CMDB_WRITE)
  removeRel(@Param('id') id: string) { return this.prisma.ciRelationship.delete({ where: { id } }); }

  @Get('cis/:id/impact') @RequirePermissions(PERMISSIONS.CMDB_READ)
  async impact(@Param('id') id: string, @Query('depth') depthStr?: string) {
    const depth = Math.min(Number(depthStr ?? 3), 5);
    const visited = new Set<string>([id]);
    const nodes: any[] = [];
    const edges: any[] = [];
    let frontier = [id];
    for (let d = 0; d < depth && frontier.length; d++) {
      const cis = await this.prisma.configurationItem.findMany({
        where: { id: { in: frontier } },
        include: { incomingRels: true, outgoingRels: true },
      });
      for (const ci of cis) {
        nodes.push({ id: ci.id, name: ci.name, refNo: ci.refNo, status: ci.status });
        const next: string[] = [];
        for (const r of [...ci.incomingRels, ...ci.outgoingRels]) {
          edges.push({ id: r.id, source: r.sourceId, target: r.targetId, type: r.type });
          for (const nid of [r.sourceId, r.targetId]) {
            if (!visited.has(nid)) {
              visited.add(nid);
              next.push(nid);
            }
          }
        }
        frontier = next;
      }
    }
    return { nodes, edges };
  }

  @Post('cis/:id/baseline') @RequirePermissions(PERMISSIONS.CMDB_WRITE)
  async baseline(@Param('id') id: string) {
    const ci = await this.prisma.configurationItem.findUniqueOrThrow({ where: { id } });
    return this.prisma.ciBaseline.create({ data: { ciId: id, snapshot: JSON.stringify(ci) } });
  }
}
