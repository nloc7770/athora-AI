import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { ProPlanGuard } from '../common/guards/pro-plan.guard';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { CacheService, CACHE_KEYS } from '../cache/cache.service';

const SUMMARY_TTL_SECONDS = 120;

@Controller('analytics')
@UseGuards(SupabaseAuthGuard)
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly cache: CacheService,
  ) {}

  @Get('summary')
  @UseGuards(ProPlanGuard)
  async getSummary(@Req() req: any) {
    const userId = req.user.id;
    // Cached after ProPlanGuard runs, so a downgraded user never reads it.
    return this.cache.wrap(
      CACHE_KEYS.analyticsSummary(userId),
      SUMMARY_TTL_SECONDS,
      () => this.analyticsService.getSummary(userId),
    );
  }

  @Get('activities')
  async getActivities(@Req() req: any) {
    const userId = req.user.id;
    return this.analyticsService.getRecentActivities(userId);
  }
}
