import { Injectable, Logger, forwardRef, Inject } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { AiGenerationService } from './ai-generation.service';
import { AI_GENERATION_QUEUE, AiGenerationJobData } from './ai-generation.constants';

@Injectable()
@Processor(AI_GENERATION_QUEUE, {
  concurrency: 3,
  limiter: {
    max: 5,
    duration: 60_000,
  },
})
export class AiGenerationProcessor extends WorkerHost {
  private readonly logger = new Logger(AiGenerationProcessor.name);

  constructor(
    @Inject(forwardRef(() => AiGenerationService))
    private readonly aiGenerationService: AiGenerationService,
  ) {
    super();
  }

  async process(job: Job<AiGenerationJobData>): Promise<void> {
    const { userId, generationId, datasetId, documentId, sessionId, type } = job.data;

    this.logger.log(
      `Processing job ${job.id}: type=${type}, generationId=${generationId}`,
    );

    try {
      await this.aiGenerationService.executeGeneration(
        userId,
        generationId,
        datasetId,
        documentId,
        sessionId ?? null,
        type,
      );
      this.logger.log(`Job ${job.id} completed: ${type}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Job ${job.id} failed: ${message}`);
      throw error; // BullMQ will handle retry
    }
  }
}
