import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { DocumentProcessorService } from './document-processor.service';
import { AiModule } from '../ai/ai.module';
import { RagflowModule } from '../ragflow/ragflow.module';
import { AiGenerationModule } from '../ai-generation/ai-generation.module';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [AiModule, RagflowModule, AiGenerationModule, AnalyticsModule],
  controllers: [DocumentsController],
  providers: [DocumentsService, DocumentProcessorService],
  exports: [DocumentsService, DocumentProcessorService],
})
export class DocumentsModule {}
