import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../common/guards/admin.guard';
import { AdminAuditService } from './admin-audit.service';
import { PaginationQueryDto } from './dto/admin.dto';

@Controller('admin/audit-log')
@UseGuards(AdminGuard)
export class AdminAuditController {
  constructor(private readonly auditService: AdminAuditService) {}

  @Get()
  findAll(
    @Query() query: PaginationQueryDto,
    @Query('adminId') adminId?: string,
    @Query('action') action?: string,
    @Query('resourceType') resourceType?: string,
  ) {
    return this.auditService.findAll({ ...query, adminId, action, resourceType });
  }
}
