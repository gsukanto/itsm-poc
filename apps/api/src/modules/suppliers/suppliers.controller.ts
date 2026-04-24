import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';
import { CounterService } from '../../common/counter.service';
import { RequirePermissions } from '../../auth/permissions.decorator';
import { PERMISSIONS } from '@itsm/shared';

@ApiTags('suppliers')
@ApiBearerAuth()
@Controller('suppliers')
export class SuppliersController {
  constructor(private prisma: PrismaService, private counter: CounterService) {}

  @Get() @RequirePermissions(PERMISSIONS.SUP_READ)
  list() { return this.prisma.supplier.findMany({ include: { contracts: true } }); }
  @Get(':id') @RequirePermissions(PERMISSIONS.SUP_READ)
  get(@Param('id') id: string) {
    return this.prisma.supplier.findUnique({
      where: { id },
      include: { contracts: { include: { obligations: true, reviews: true } } },
    });
  }
  @Post() @RequirePermissions(PERMISSIONS.SUP_WRITE)
  create(@Body() body: any) { return this.prisma.supplier.create({ data: body }); }
  @Patch(':id') @RequirePermissions(PERMISSIONS.SUP_WRITE)
  update(@Param('id') id: string, @Body() body: any) { return this.prisma.supplier.update({ where: { id }, data: body }); }

  @Post(':id/contracts') @RequirePermissions(PERMISSIONS.SUP_WRITE)
  async addContract(@Param('id') id: string, @Body() body: any) {
    const refNo = await this.counter.next('CONTRACT');
    return this.prisma.contract.create({ data: { ...body, supplierId: id, refNo } });
  }
  @Post('contracts/:cid/obligations') @RequirePermissions(PERMISSIONS.SUP_WRITE)
  addObligation(@Param('cid') cid: string, @Body() body: any) {
    return this.prisma.contractObligation.create({ data: { ...body, contractId: cid } });
  }
  @Patch('obligations/:oid') @RequirePermissions(PERMISSIONS.SUP_WRITE)
  updateObligation(@Param('oid') oid: string, @Body() body: any) {
    return this.prisma.contractObligation.update({ where: { id: oid }, data: body });
  }
  @Post('contracts/:cid/reviews') @RequirePermissions(PERMISSIONS.SUP_WRITE)
  addReview(@Param('cid') cid: string, @Body() body: any) {
    return this.prisma.supplierReview.create({ data: { ...body, contractId: cid, reviewedAt: new Date() } });
  }
}
