import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('roles')
@ApiBearerAuth()
@Controller('roles')
export class RolesController {
  constructor(private prisma: PrismaService) {}
  @Get() list() { return this.prisma.role.findMany({ include: { permissions: { include: { permission: true } } } }); }
  @Post() create(@Body() body: any) { return this.prisma.role.create({ data: body }); }
  @Patch(':id') update(@Param('id') id: string, @Body() body: any) { return this.prisma.role.update({ where: { id }, data: body }); }
  @Delete(':id') remove(@Param('id') id: string) { return this.prisma.role.delete({ where: { id } }); }

  @Get('permissions') perms() { return this.prisma.permission.findMany(); }

  @Post(':id/permissions')
  addPerm(@Param('id') id: string, @Body() body: { permissionId: string }) {
    return this.prisma.rolePermission.create({ data: { roleId: id, permissionId: body.permissionId } });
  }
  @Delete(':id/permissions/:permissionId')
  removePerm(@Param('id') id: string, @Param('permissionId') permissionId: string) {
    return this.prisma.rolePermission.delete({ where: { roleId_permissionId: { roleId: id, permissionId } } });
  }
}
