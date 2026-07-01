import { Module } from '@nestjs/common';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminDashboardService } from './admin-dashboard.service';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';
import { AdminCreditsController } from './admin-credits.controller';
import { AdminCreditsService } from './admin-credits.service';
import { AdminAuditController } from './admin-audit.controller';
import { AdminAuditService } from './admin-audit.service';
import { AdminContentController } from './admin-content.controller';
import { AdminBillingController } from './admin-billing.controller';
import { AdminAiController } from './admin-ai.controller';
import { AdminSystemController } from './admin-system.controller';

@Module({
  controllers: [
    AdminDashboardController,
    AdminUsersController,
    AdminCreditsController,
    AdminAuditController,
    AdminContentController,
    AdminBillingController,
    AdminAiController,
    AdminSystemController,
  ],
  providers: [
    AdminDashboardService,
    AdminUsersService,
    AdminCreditsService,
    AdminAuditService,
  ],
  exports: [AdminAuditService],
})
export class AdminModule {}
