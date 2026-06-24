import { Module } from '@nestjs/common';
import { AiGenerationController } from './ai-generation.controller';
import { AiGenerationService } from './ai-generation.service';
import { SummaryGenerator } from './generators/summary.generator';
import { FlashcardGenerator } from './generators/flashcard.generator';
import { ExamGenerator } from './generators/exam.generator';
import { MindmapGenerator } from './generators/mindmap.generator';

@Module({
  controllers: [AiGenerationController],
  providers: [
    AiGenerationService,
    SummaryGenerator,
    FlashcardGenerator,
    ExamGenerator,
    MindmapGenerator,
  ],
  exports: [AiGenerationService],
})
export class AiGenerationModule {}
