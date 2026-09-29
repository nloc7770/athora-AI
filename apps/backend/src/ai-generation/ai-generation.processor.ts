import { Injectable, Logger, forwardRef, Inject } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { AiGenerationService } from './ai-generation.service';
import { AI_GENERATION_QUEUE, AiGenerationJobData } from './ai-generation.constants';

/**
 * These limits guard the LLM provider's rate limit, and BullMQ applies them
 * PER WORKER — not across the cluster. So the moment this process is replicated
 * behind a load balancer, the real ceiling becomes N x max, and the protection
 * silently disappears at exactly the moment load justified scaling.
 *
 * Hence the env switch: API replicas run with AI_WORKER_ENABLED=false and only
 * enqueue, while exactly ONE worker replica drains the queue. `autorun: false`
 * is what makes that work — the worker is still constructed and wired, it just
 * never starts consuming, so the API pods keep their queue producer and their
 * health checks without ever pulling a job.
 */
@Injectable()
@Processor(AI_GENERATION_QUEUE, {
  concurrency: Number(process.env.AI_WORKER_CONCURRENCY ?? 3),
  limiter: {
    max: Number(process.env.AI_WORKER_RATE_MAX ?? 5),
    duration: 60_000,
  },
  autorun: process.env.AI_WORKER_ENABLED !== 'false',
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
