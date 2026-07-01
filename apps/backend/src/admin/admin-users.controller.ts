import { Controller, Get, Patch, Post, Param, Query, Body, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { AdminGuard } from '../common/guards/admin.guard';
import { AdminUsersService } from './admin-users.service';
import { PaginationQueryDto, AdminUpdateUserDto, BanUserDto } from './dto/admin.dto';

@Controller('admin/users')
@UseGuards(AdminGuard)
export class AdminUsersController {
  constructor(private readonly usersService: AdminUsersService) {}

  @Get()
  findAll(
    @Query() query: PaginationQueryDto,
    @Query('role') role?: string,
  ) {
    return this.usersService.findAll({ ...query, role });
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminUpdateUserDto,
  ) {
    return this.usersService.update(id, dto);
  }

  @Post(':id/ban')
  ban(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: BanUserDto,
  ) {
    return this.usersService.ban(id, dto);
  }

  @Post(':id/unban')
  unban(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.unban(id);
  }
}
