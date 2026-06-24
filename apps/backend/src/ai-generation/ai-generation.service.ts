import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import {
  AiGeneration,
  GenerationType,
  SummaryOutput,
  FlashcardOutput,
  ExamOutput,
  MindmapOutput,
} from './dto/generate.dto';
import { SummaryGenerator } from './generators/summary.generator';
import { FlashcardGenerator } from './generators/flashcard.generator';
import { ExamGenerator } from './generators/exam.generator';
import { MindmapGenerator } from './generators/mindmap.generator';

@Injectable()
export class AiGenerationService {
  private readonly logger = new Logger(AiGenerationService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly summaryGenerator: SummaryGenerator,
    private readonly flashcardGenerator: FlashcardGenerator,
    private readonly examGenerator: ExamGenerator,
    private readonly mindmapGenerator: MindmapGenerator,
  ) {}

  async generate(
    userId: string,
    documentId: string,
    type: GenerationType,
  ): Promise<AiGeneration> {
    const document = await this.getDocument(userId, documentId);
    const datasetId = document.dataset_id;

    if (!datasetId) {
      throw new NotFoundException(
        'Document has no associated dataset. Ensure the document is processed first.',
      );
    }

    const generation = await this.createGenerationRecord(
      userId,
      documentId,
      type,
    );

    this.executeGeneration(userId, generation.id, datasetId, documentId, type)
      .catch((error) => {
        this.logger.error(`Generation failed: ${error.message}`, {
          generationId: generation.id,
          type,
        });
      });

    return generation;
  }

  async getGeneration(userId: string, generationId: string): Promise<AiGeneration> {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('ai_generations')
      .select('*')
      .eq('id', generationId)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      throw new NotFoundException('Generation not found');
    }

    return data as AiGeneration;
  }

  async getGenerationsByDocument(
    userId: string,
    documentId: string,
  ): Promise<AiGeneration[]> {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('ai_generations')
      .select('*')
      .eq('document_id', documentId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new NotFoundException('Could not fetch generations');
    }

    return (data ?? []) as AiGeneration[];
  }

  private async getDocument(userId: string, documentId: string) {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      throw new NotFoundException('Document not found');
    }

    return data;
  }

  private async createGenerationRecord(
    userId: string,
    documentId: string,
    type: GenerationType,
  ): Promise<AiGeneration> {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('ai_generations')
      .insert({
        user_id: userId,
        document_id: documentId,
        type,
        status: 'pending',
        output: null,
      })
      .select()
      .single();

    if (error || !data) {
      throw new NotFoundException(error?.message ?? 'Could not create generation record');
    }

    return data as AiGeneration;
  }

  private async executeGeneration(
    userId: string,
    generationId: string,
    datasetId: string,
    documentId: string,
    type: GenerationType,
  ): Promise<void> {
    try {
      const output = await this.runGenerator(userId, datasetId, documentId, type);

      await this.supabaseService
        .getAdminClient()
        .from('ai_generations')
        .update({
          status: 'completed',
          output,
          updated_at: new Date().toISOString(),
        })
        .eq('id', generationId);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';

      await this.supabaseService
        .getAdminClient()
        .from('ai_generations')
        .update({
          status: 'failed',
          error: message,
          updated_at: new Date().toISOString(),
        })
        .eq('id', generationId);
    }
  }

  private async runGenerator(
    userId: string,
    datasetId: string,
    documentId: string,
    type: GenerationType,
  ): Promise<SummaryOutput | FlashcardOutput | ExamOutput | MindmapOutput> {
    switch (type) {
      case GenerationType.SUMMARY:
        return this.summaryGenerator.generate(datasetId, documentId);
      case GenerationType.FLASHCARD:
        return this.flashcardGenerator.generate(datasetId, documentId, userId);
      case GenerationType.EXAM:
        return this.examGenerator.generate(datasetId, documentId, userId);
      case GenerationType.MINDMAP:
        return this.mindmapGenerator.generate(datasetId, documentId);
    }
  }
}
