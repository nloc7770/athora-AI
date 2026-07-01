import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { SupabaseService } from '../supabase/supabase.service';
import { AnalyticsService } from '../analytics/analytics.service';
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
import { AI_GENERATION_QUEUE, AiGenerationJobData } from './ai-generation.constants';

@Injectable()
export class AiGenerationService {
  private readonly logger = new Logger(AiGenerationService.name);

  constructor(
    @InjectQueue(AI_GENERATION_QUEUE) private readonly generationQueue: Queue<AiGenerationJobData>,
    private readonly supabaseService: SupabaseService,
    private readonly analyticsService: AnalyticsService,
    private readonly summaryGenerator: SummaryGenerator,
    private readonly flashcardGenerator: FlashcardGenerator,
    private readonly examGenerator: ExamGenerator,
    private readonly mindmapGenerator: MindmapGenerator,
  ) {}

  private async getUserPriority(userId: string): Promise<number> {
    const client = this.supabaseService.getAdminClient();
    const { data: subscription } = await client
      .from('subscriptions')
      .select('plans(features)')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    const features = (subscription as any)?.plans?.features;
    return features?.priority_queue ? 1 : 5;
  }

  async generate(
    userId: string,
    documentId: string,
    type: GenerationType,
  ): Promise<AiGeneration> {
    const document = await this.getDocument(userId, documentId);
    const datasetId = document.ragflow_dataset_id;

    if (!datasetId) {
      throw new NotFoundException(
        'Document has no associated dataset. Ensure the document is processed first.',
      );
    }

    const generation = await this.createGenerationRecord(
      userId,
      type,
      { documentId },
    );

    await this.generationQueue.add(
      `${type}-${generation.id}`,
      {
        userId,
        generationId: generation.id,
        datasetId,
        documentId,
        sessionId: null,
        type,
      },
      {
        priority: await this.getUserPriority(userId),
        attempts: 2,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    );

    return generation;
  }

  async generateForSession(
    userId: string,
    sessionId: string,
    type: GenerationType,
  ): Promise<AiGeneration> {
    const session = await this.getSession(userId, sessionId);
    let datasetId = session.ragflow_dataset_id;

    // Fallback: find dataset from session's documents
    if (!datasetId) {
      const { data: docs } = await this.supabaseService
        .getAdminClient()
        .from('documents')
        .select('ragflow_dataset_id')
        .eq('session_id', sessionId)
        .eq('user_id', userId)
        .not('ragflow_dataset_id', 'is', null)
        .limit(1);

      datasetId = docs?.[0]?.ragflow_dataset_id ?? null;
    }

    if (!datasetId) {
      throw new NotFoundException(
        'No processed documents found in this session. Upload and wait for processing to complete.',
      );
    }

    const generation = await this.createGenerationRecord(
      userId,
      type,
      { sessionId },
    );

    await this.generationQueue.add(
      `${type}-${generation.id}`,
      {
        userId,
        generationId: generation.id,
        datasetId,
        documentId: null,
        sessionId,
        type,
      },
      {
        priority: await this.getUserPriority(userId),
        attempts: 2,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    );

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

  async getGenerationsBySession(
    userId: string,
    sessionId: string,
  ): Promise<AiGeneration[]> {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('ai_generations')
      .select('*')
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new NotFoundException('Could not fetch session generations');
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

  private async getSession(userId: string, sessionId: string) {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('study_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      throw new NotFoundException('Session not found');
    }

    return data;
  }

  private async createGenerationRecord(
    userId: string,
    type: GenerationType,
    ref: { documentId?: string; sessionId?: string },
  ): Promise<AiGeneration> {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('ai_generations')
      .insert({
        user_id: userId,
        document_id: ref.documentId ?? null,
        session_id: ref.sessionId ?? null,
        type,
        status: 'pending',
      })
      .select()
      .single();

    if (error || !data) {
      throw new NotFoundException(error?.message ?? 'Could not create generation record');
    }

    return data as AiGeneration;
  }

  async executeGeneration(
    userId: string,
    generationId: string,
    datasetId: string,
    documentId: string | null,
    sessionId: string | null,
    type: GenerationType,
  ): Promise<void> {
    try {
      await this.supabaseService
        .getAdminClient()
        .from('ai_generations')
        .update({ status: 'processing' })
        .eq('id', generationId);

      this.logger.log(`Running generator ${type} for ${generationId}`);
      const output = await this.runGenerator(userId, datasetId, documentId, sessionId, type);
      this.logger.log(`Generator ${type} completed for ${generationId}, saving result...`);

      const { error: updateError } = await this.supabaseService
        .getAdminClient()
        .from('ai_generations')
        .update({
          status: 'completed',
          result: output,
        })
        .eq('id', generationId);

      if (updateError) {
        this.logger.error(`Failed to save generation result: ${updateError.message}`);
      } else {
        this.logger.log(`Generation ${generationId} saved successfully`);
        if (type === GenerationType.EXAM) {
          this.analyticsService.logActivity(userId, 'exam_generation', 0, sessionId ?? undefined, {
            generationId,
            examId: (output as ExamOutput & { examId?: string }).examId,
          }).catch(() => {});
        } else if (type === GenerationType.FLASHCARD) {
          this.analyticsService.logActivity(userId, 'flashcard_generation', 0, sessionId ?? undefined, {
            generationId,
            cardCount: (output as FlashcardOutput).cards?.length ?? 0,
          }).catch(() => {});
        }
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Generation ${generationId} failed: ${message}`);

      await this.supabaseService
        .getAdminClient()
        .from('ai_generations')
        .update({
          status: 'error',
          error_message: message,
        })
        .eq('id', generationId);
    }
  }

  private async runGenerator(
    userId: string,
    datasetId: string,
    documentId: string | null,
    sessionId: string | null,
    type: GenerationType,
  ): Promise<SummaryOutput | FlashcardOutput | ExamOutput | MindmapOutput> {
    switch (type) {
      case GenerationType.SUMMARY:
        return this.summaryGenerator.generate(datasetId, documentId);
      case GenerationType.FLASHCARD:
        return this.flashcardGenerator.generate(datasetId, documentId, userId, sessionId);
      case GenerationType.EXAM:
        return this.examGenerator.generate(datasetId, documentId, userId, sessionId);
      case GenerationType.MINDMAP:
        return this.mindmapGenerator.generate(datasetId, documentId);
    }
  }
}
