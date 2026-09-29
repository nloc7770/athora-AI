import { Controller, Get, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CacheService, CACHE_KEYS } from '../cache/cache.service';
import { BrainService } from './brain.service';

const BRAIN_GRAPH_TTL_SECONDS = 60;

@Controller('brain')
@UseGuards(SupabaseAuthGuard)
export class BrainController {
  constructor(
    private readonly brainService: BrainService,
    private readonly cache: CacheService,
  ) {}

  /** The student's knowledge graph. Client picks node caps per viewport. */
  @Get('graph')
  getGraph(@CurrentUser('id') userId: string) {
    return this.cache.wrap(
      CACHE_KEYS.brainGraph(userId),
      BRAIN_GRAPH_TTL_SECONDS,
      () => this.brainService.getGraph(userId),
    );
  }
}
