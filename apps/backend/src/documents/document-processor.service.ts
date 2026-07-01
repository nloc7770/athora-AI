import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';
import { RagflowService } from '../ragflow/ragflow.service';
import { AiGenerationService } from '../ai-generation/ai-generation.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { GenerationType } from '../ai-generation/dto/generate.dto';

interface ProcessingResult {
  fileUrl: string;
  ragflowDatasetId: string;
  ragflowDocumentId: string;
}

@Injectable()
export class DocumentProcessorService {
  private readonly logger = new Logger(DocumentProcessorService.name);
  private readonly storageBucket: string;
  private readonly pollingIntervalMs: number;
  private readonly pollingMaxAttempts: number;
  private readonly maxConcurrent = 5;
  private activeProcessing = 0;

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly ragflowService: RagflowService,
    private readonly configService: ConfigService,
    private readonly aiGenerationService: AiGenerationService,
    private readonly analyticsService: AnalyticsService,
  ) {
    this.storageBucket = this.configService.get<string>(
      'SUPABASE_STORAGE_BUCKET',
      'documents',
    );
    this.pollingIntervalMs = this.configService.get<number>(
      'RAGFLOW_POLLING_INTERVAL_MS',
      5000,
    );
    this.pollingMaxAttempts = this.configService.get<number>(
      'RAGFLOW_POLLING_MAX_ATTEMPTS',
      360,
    );
  }

  async processDocument(
    userId: string,
    documentId: string,
    file: Express.Multer.File,
  ): Promise<void> {
    if (this.activeProcessing >= this.maxConcurrent) {
      throw new HttpException(
        'Too many documents being processed. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    this.activeProcessing++;
    try {
      await this.updateDocumentStatus(userId, documentId, 'uploading', 0);

      const fileUrl = await this.uploadToStorage(userId, documentId, file);

      await this.updateDocumentRecord(userId, documentId, {
        file_url: fileUrl,
        file_size: file.size,
      });

      await this.updateDocumentStatus(userId, documentId, 'processing', 10);

      const datasetId = await this.getOrCreateDataset(userId, documentId);

      await this.updateDocumentStatus(userId, documentId, 'processing', 30);

      const ragflowDocId = await this.uploadToRagflow(
        datasetId,
        file,
      );

      await this.updateDocumentRecord(userId, documentId, {
        ragflow_dataset_id: datasetId,
        ragflow_document_id: ragflowDocId,
      });

      await this.updateDocumentStatus(userId, documentId, 'parsing', 50);

      await this.ragflowService.parseDocument(datasetId, [ragflowDocId]);

      await this.pollForCompletion(userId, documentId, datasetId, ragflowDocId);

      await this.updateDocumentStatus(userId, documentId, 'ready', 100);

      this.logger.log(`Document ${documentId} processed successfully`);

      this.analyticsService.logActivity(userId, 'document_upload', 0, undefined, {
        documentId,
        documentName: file.originalname,
      }).catch(() => {});

      // Auto-generate all AI content in background
      this.autoGenerate(userId, documentId).catch((err) => {
        this.logger.error(`Auto-generation failed for ${documentId}: ${err.message}`);
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown processing error';
      this.logger.error(
        `Document processing failed for ${documentId}: ${message}`,
      );
      await this.updateDocumentStatus(userId, documentId, 'failed', 0);
      throw error;
    } finally {
      this.activeProcessing--;
    }
  }

  async getProcessingStatus(
    userId: string,
    documentId: string,
  ): Promise<{ status: string; progress: number }> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('documents')
      .select('status, processing_progress')
      .eq('id', documentId)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return { status: 'unknown', progress: 0 };
    }

    return {
      status: data.status ?? 'unknown',
      progress: data.processing_progress ?? 0,
    };
  }

  async getDocumentSignedUrl(
    userId: string,
    documentId: string,
  ): Promise<{ url: string; expiresIn: number }> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('documents')
      .select('file_url')
      .eq('id', documentId)
      .eq('user_id', userId)
      .single();

    if (error || !data?.file_url) {
      throw new HttpException('Document not found', HttpStatus.NOT_FOUND);
    }

    // Extract the storage path from the stored URL
    // The file_url now contains a signed URL; derive path from known structure
    const filePath = `${userId}/${documentId}`;

    // List files in the document folder to find the actual file
    const { data: files, error: listError } = await this.supabaseService
      .getAdminClient()
      .storage.from(this.storageBucket)
      .list(filePath);

    if (listError || !files || files.length === 0) {
      throw new HttpException(
        'Document file not found in storage',
        HttpStatus.NOT_FOUND,
      );
    }

    const fullPath = `${filePath}/${files[0].name}`;
    const expiresIn = 3600;

    const { data: signedUrlData, error: signedUrlError } =
      await this.supabaseService
        .getAdminClient()
        .storage.from(this.storageBucket)
        .createSignedUrl(fullPath, expiresIn);

    if (signedUrlError || !signedUrlData?.signedUrl) {
      throw new HttpException(
        'Failed to generate signed URL',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return { url: signedUrlData.signedUrl, expiresIn };
  }

  private async uploadToStorage(
    userId: string,
    documentId: string,
    file: Express.Multer.File,
  ): Promise<string> {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `${userId}/${documentId}/${safeName}`;

    const { error } = await this.supabaseService
      .getAdminClient()
      .storage.from(this.storageBucket)
      .upload(filePath, file.buffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (error) {
      throw new Error(`Storage upload failed: ${error.message}`);
    }

    const { data: signedUrlData, error: signedUrlError } =
      await this.supabaseService
        .getAdminClient()
        .storage.from(this.storageBucket)
        .createSignedUrl(filePath, 3600);

    if (signedUrlError || !signedUrlData?.signedUrl) {
      throw new Error(
        `Failed to create signed URL: ${signedUrlError?.message ?? 'Unknown error'}`,
      );
    }

    return signedUrlData.signedUrl;
  }

  private async getOrCreateDataset(
    userId: string,
    documentId: string,
  ): Promise<string> {
    const { data } = await this.supabaseService
      .getClient()
      .from('documents')
      .select('course_id, session_id')
      .eq('id', documentId)
      .eq('user_id', userId)
      .single();

    const sessionId = data?.session_id;
    const courseId = data?.course_id;

    // Priority 1: Use session's dataset (all docs in session share one dataset)
    if (sessionId) {
      const { data: session } = await this.supabaseService
        .getClient()
        .from('study_sessions')
        .select('ragflow_dataset_id')
        .eq('id', sessionId)
        .eq('user_id', userId)
        .single();

      if (session?.ragflow_dataset_id) {
        return session.ragflow_dataset_id;
      }
    }

    // Priority 2: Reuse course dataset if exists
    if (courseId) {
      const { data: existingDoc } = await this.supabaseService
        .getClient()
        .from('documents')
        .select('ragflow_dataset_id')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .not('ragflow_dataset_id', 'is', null)
        .limit(1)
        .single();

      if (existingDoc?.ragflow_dataset_id) {
        return existingDoc.ragflow_dataset_id;
      }
    }

    // Priority 3: Create new dataset
    const datasetName = sessionId
      ? `session_${sessionId}`
      : courseId
        ? `user_${userId}_course_${courseId}`
        : `user_${userId}_doc_${documentId}`;

    const { id } = await this.ragflowService.createDataset(datasetName, userId);
    return id;
  }

  private async uploadToRagflow(
    datasetId: string,
    file: Express.Multer.File,
  ): Promise<string> {
    const { id } = await this.ragflowService.uploadDocument(
      datasetId,
      file.buffer,
      file.originalname,
    );
    return id;
  }

  private async pollForCompletion(
    userId: string,
    documentId: string,
    datasetId: string,
    ragflowDocId: string,
  ): Promise<void> {
    for (let attempt = 0; attempt < this.pollingMaxAttempts; attempt++) {
      await this.sleep(this.pollingIntervalMs);

      const { status, progress } = await this.ragflowService.getDocumentStatus(
        datasetId,
        ragflowDocId,
      );

      const normalizedProgress = Math.min(
        50 + Math.round(progress * 50),
        99,
      );
      await this.updateDocumentStatus(
        userId,
        documentId,
        'parsing',
        normalizedProgress,
      );

      if (status === '1' || status === 'done' || status === 'completed' || status === 'DONE') {
        return;
      }

      if (status === 'error' || status === 'failed' || status === '-1' || status === 'FAIL' || status === 'CANCEL') {
        throw new Error(
          `RAGFlow parsing failed for document ${ragflowDocId}`,
        );
      }
    }

    throw new Error(
      `RAGFlow parsing timed out after ${this.pollingMaxAttempts} attempts`,
    );
  }

  private async updateDocumentStatus(
    userId: string,
    documentId: string,
    status: string,
    progress: number,
  ): Promise<void> {
    await this.supabaseService
      .getAdminClient()
      .from('documents')
      .update({
        status,
        processing_progress: progress,
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId)
      .eq('user_id', userId);
  }

  private async updateDocumentRecord(
    userId: string,
    documentId: string,
    fields: Record<string, unknown>,
  ): Promise<void> {
    await this.supabaseService
      .getAdminClient()
      .from('documents')
      .update({
        ...fields,
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId)
      .eq('user_id', userId);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async autoGenerate(userId: string, documentId: string): Promise<void> {
    // All AI generation is now user-triggered to save costs
    this.logger.log(`Document ${documentId} ready — user can generate content on demand`);
  }
}
