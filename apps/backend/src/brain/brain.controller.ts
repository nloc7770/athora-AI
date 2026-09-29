import { Controller, Get, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { BrainService } from './brain.service';

@Controller('brain')
@UseGuards(SupabaseAuthGuard)
export class BrainController {
  constructor(private readonly brainService: BrainService) {}

  /** The student's knowledge graph. Client picks node caps per viewport. */
  @Get('graph')
  getGraph(@CurrentUser('id') userId: string) {
    return this.brainService.getGraph(userId);
  }
}
