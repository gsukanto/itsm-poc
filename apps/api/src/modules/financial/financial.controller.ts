import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';
import { RequirePermissions } from '../../auth/permissions.decorator';
import { PERMISSIONS } from '@itsm/shared';

@ApiTags('financial')
@ApiBearerAuth()
@Controller('financial')
export class FinancialController {
  constructor(private prisma: PrismaService) {}

  @Get('cost-centers') @RequirePermissions(PERMISSIONS.FIN_READ)
  ccs() { return this.prisma.costCenter.findMany(); }
  @Post('cost-centers') @RequirePermissions(PERMISSIONS.FIN_WRITE)
  createCc(@Body() body: any) { return this.prisma.costCenter.create({ data: body }); }

  @Get('cost-models') @RequirePermissions(PERMISSIONS.FIN_READ)
  models() { return this.prisma.costModel.findMany(); }
  @Post('cost-models') @RequirePermissions(PERMISSIONS.FIN_WRITE)
  createModel(@Body() body: any) { return this.prisma.costModel.create({ data: body }); }

  @Get('budgets') @RequirePermissions(PERMISSIONS.FIN_READ)
  budgets() { return this.prisma.budget.findMany({ include: { costCenter: true } }); }
  @Post('budgets') @RequirePermissions(PERMISSIONS.FIN_WRITE)
  createBudget(@Body() body: any) { return this.prisma.budget.create({ data: body }); }

  @Get('charges') @RequirePermissions(PERMISSIONS.FIN_READ)
  charges(@Query('costCenterId') ccId?: string) {
    return this.prisma.charge.findMany({ where: ccId ? { costCenterId: ccId } : {}, include: { costCenter: true }, orderBy: { occurredAt: 'desc' }, take: 500 });
  }
  @Post('charges') @RequirePermissions(PERMISSIONS.FIN_WRITE)
  createCharge(@Body() body: any) { return this.prisma.charge.create({ data: body }); }

  @Get('chargeback/:fy') @RequirePermissions(PERMISSIONS.FIN_READ)
  async chargeback(@Param('fy') fy: string) {
    const yearStart = new Date(`${fy}-01-01`);
    const yearEnd = new Date(`${Number(fy) + 1}-01-01`);
    const ccs = await this.prisma.costCenter.findMany({
      include: {
        budgets: { where: { fiscalYear: Number(fy) } },
        charges: { where: { occurredAt: { gte: yearStart, lt: yearEnd } } },
      },
    });
    return ccs.map((cc) => {
      const spent = cc.charges.reduce((s, c) => s + c.amountCents, 0);
      const budget = cc.budgets[0]?.amountCents ?? 0;
      return { id: cc.id, key: cc.key, name: cc.name, budget, spent, remaining: budget - spent, currency: cc.budgets[0]?.currency ?? 'USD' };
    });
  }
}
