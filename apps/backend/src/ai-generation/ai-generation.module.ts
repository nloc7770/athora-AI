import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AiGenerationController } from './ai-generation.controller';
import { AiGenerationService } from './ai-generation.service';
import { AiGenerationProcessor } from './ai-generation.processor';
import { AI_GENERATION_QUEUE } from './ai-generation.constants';
import { SummaryGenerator } from './generators/summary.generator';
import { FlashcardGenerator } from './generators/flashcard.generator';
import { ExamGenerator } from './generators/exam.generator';
import { MindmapGenerator } from './generators/mindmap.generator';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: AI_GENERATION_QUEUE,
      defaultJobOptions: {
        attempts: 2,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    }),
    AnalyticsModule,
  ],
  controllers: [AiGenerationController],
  providers: [
    AiGenerationService,
    AiGenerationProcessor,
    SummaryGenerator,
    FlashcardGenerator,
    ExamGenerator,
    MindmapGenerator,
  ],
  exports: [AiGenerationService],
})
export class AiGenerationModule {}
