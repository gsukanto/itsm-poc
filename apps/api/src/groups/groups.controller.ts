import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('groups')
@ApiBearerAuth()
@Controller('groups')
export class GroupsController {
  constructor(private prisma: PrismaService) {}
  @Get() list() { return this.prisma.group.findMany({ include: { members: { include: { user: true } } } }); }
  @Get(':id') get(@Param('id') id: string) { return this.prisma.group.findUnique({ where: { id }, include: { members: { include: { user: true } } } }); }
  @Post() create(@Body() body: any) { return this.prisma.group.create({ data: body }); }
  @Patch(':id') update(@Param('id') id: string, @Body() body: any) { return this.prisma.group.update({ where: { id }, data: body }); }
  @Delete(':id') remove(@Param('id') id: string) { return this.prisma.group.update({ where: { id }, data: { isActive: false } }); }

  @Post(':id/members')
  addMember(@Param('id') id: string, @Body() body: { userId: string; isLead?: boolean }) {
    return this.prisma.groupMembership.create({ data: { groupId: id, userId: body.userId, isLead: !!body.isLead } });
  }
  @Delete(':id/members/:userId')
  removeMember(@Param('id') id: string, @Param('userId') userId: string) {
    return this.prisma.groupMembership.delete({ where: { userId_groupId: { userId, groupId: id } } });
  }
}
