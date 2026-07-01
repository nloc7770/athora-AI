import { Controller, Get, Post, Param, Query, Body, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { AdminGuard } from '../common/guards/admin.guard';
import { AdminCreditsService } from './admin-credits.service';
import { PaginationQueryDto, CreditAdjustDto } from './dto/admin.dto';

@Controller('admin/credits')
@UseGuards(AdminGuard)
export class AdminCreditsController {
  constructor(private readonly creditsService: AdminCreditsService) {}

  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.creditsService.findAll(query);
  }

  @Get(':userId/transactions')
  getTransactions(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.creditsService.getTransactions(userId, query);
  }

  @Post(':userId/adjust')
  adjust(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: CreditAdjustDto,
  ) {
    return this.creditsService.adjust(userId, dto);
  }
}
