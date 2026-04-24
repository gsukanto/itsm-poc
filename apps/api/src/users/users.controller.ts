import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/jwt.strategy';
import { Public } from '../auth/public.decorator';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private prisma: PrismaService) {}

  @Get('me') me(@CurrentUser() u: AuthUser) { return u; }

  @Get()
  list(@Query('q') q?: string) {
    return this.prisma.user.findMany({
      where: q ? { OR: [{ email: { contains: q } }, { displayName: { contains: q } }] } : {},
      take: 100,
      orderBy: { displayName: 'asc' },
    });
  }

  @Get(':id') get(@Param('id') id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { roles: { include: { role: true } }, memberships: { include: { group: true } } },
    });
  }

  @Post() create(@Body() body: any) { return this.prisma.user.create({ data: body }); }
  @Patch(':id') update(@Param('id') id: string, @Body() body: any) { return this.prisma.user.update({ where: { id }, data: body }); }
  @Delete(':id') remove(@Param('id') id: string) { return this.prisma.user.update({ where: { id }, data: { isActive: false } }); }

  @Post(':id/roles')
  async assignRole(@Param('id') id: string, @Body() body: { roleId: string }) {
    return this.prisma.userRole.create({ data: { userId: id, roleId: body.roleId } });
  }
  @Delete(':id/roles/:roleId')
  async removeRole(@Param('id') id: string, @Param('roleId') roleId: string) {
    return this.prisma.userRole.delete({ where: { userId_roleId: { userId: id, roleId } } });
  }
}
