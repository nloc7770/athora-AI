import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { ProPlanGuard } from '../common/guards/pro-plan.guard';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';

@Controller('analytics')
@UseGuards(SupabaseAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('summary')
  @UseGuards(ProPlanGuard)
  async getSummary(@Req() req: any) {
    const userId = req.user.id;
    return this.analyticsService.getSummary(userId);
  }

  @Get('activities')
  async getActivities(@Req() req: any) {
    const userId = req.user.id;
    return this.analyticsService.getRecentActivities(userId);
  }
}
