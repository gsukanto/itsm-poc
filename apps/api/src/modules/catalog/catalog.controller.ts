import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';
import { Public } from '../../auth/public.decorator';

@ApiTags('catalog')
@ApiBearerAuth()
@Controller('catalog')
export class CatalogController {
  constructor(private prisma: PrismaService) {}

  @Get('categories') categories() { return this.prisma.serviceCatalogCategory.findMany({ include: { items: true, children: true } }); }
  @Post('categories') createCat(@Body() body: any) { return this.prisma.serviceCatalogCategory.create({ data: body }); }

  @Get('items')
  items(@Query('q') q?: string, @Query('categoryId') categoryId?: string) {
    return this.prisma.catalogItem.findMany({
      where: {
        isActive: true,
        ...(categoryId ? { categoryId } : {}),
        ...(q ? { OR: [{ name: { contains: q } }, { key: { contains: q } }] } : {}),
      },
      include: { category: true },
      orderBy: { name: 'asc' },
    });
  }

  @Get('items/:id') item(@Param('id') id: string) {
    return this.prisma.catalogItem.findUnique({ where: { id }, include: { category: true } });
  }
  @Post('items') createItem(@Body() body: any) { return this.prisma.catalogItem.create({ data: body }); }
  @Patch('items/:id') updateItem(@Param('id') id: string, @Body() body: any) { return this.prisma.catalogItem.update({ where: { id }, data: body }); }
  @Delete('items/:id') removeItem(@Param('id') id: string) { return this.prisma.catalogItem.update({ where: { id }, data: { isActive: false } }); }
}
