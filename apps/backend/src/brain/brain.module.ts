import { Module } from '@nestjs/common';
import { SupabaseModule } from '../supabase/supabase.module';
import { BrainController } from './brain.controller';
import { BrainService } from './brain.service';

@Module({
  imports: [SupabaseModule],
  controllers: [BrainController],
  providers: [BrainService],
})
export class BrainModule {}
