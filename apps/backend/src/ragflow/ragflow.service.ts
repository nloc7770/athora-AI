import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import FormData = require('form-data');

export interface Chunk {
  id: string;
  content: string;
  documentId: string;
  score: number;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class RagflowService {
  private readonly client: AxiosInstance;
  private readonly logger = new Logger(RagflowService.name);
  private readonly embeddingModel: string;

  constructor(private readonly config: ConfigService) {
    const baseURL = this.config.getOrThrow<string>('RAGFLOW_API_URL');
    const apiKey = this.config.getOrThrow<string>('RAGFLOW_API_KEY');
    this.embeddingModel = this.config.get<string>(
      'RAGFLOW_EMBEDDING_MODEL',
      'BAAI/bge-small-en-v1.5@TEI',
    );

    this.client = axios.create({
      baseURL,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async createDataset(
    name: string,
    userId: string,
  ): Promise<{ id: string }> {
    const response = await this.client.post('/api/v1/datasets', {
      name,
      description: `Dataset for user ${userId}`,
    });

    const id = response.data?.data?.id;

    if (!id) {
      this.logger.error('Failed to create dataset', { name, userId });
      throw new Error('RAGFlow returned no dataset ID');
    }

    return { id };
  }

  async uploadDocument(
    datasetId: string,
    file: Buffer,
    filename: string,
  ): Promise<{ id: string }> {
    const form = new FormData();
    form.append('file', file, { filename, contentType: 'application/pdf' });

    const response = await this.client.post(
      `/api/v1/datasets/${datasetId}/documents`,
      form,
      {
        headers: { ...form.getHeaders() },
      },
    );

    const id = response.data?.data?.[0]?.id ?? response.data?.data?.id;

    if (!id) {
      this.logger.error('Failed to upload document', { datasetId, filename });
      throw new Error('RAGFlow returned no document ID');
    }

    return { id };
  }

  async getDocumentStatus(
    datasetId: string,
    documentId: string,
  ): Promise<{ status: string; progress: number }> {
    const response = await this.client.get(
      `/api/v1/datasets/${datasetId}/documents`,
      { params: { id: documentId } },
    );

    const rawData = response.data?.data;
    const docs = Array.isArray(rawData)
      ? rawData
      : Array.isArray(rawData?.docs)
        ? rawData.docs
        : [];

    const doc = docs.find((d: { id: string }) => d.id === documentId);

    if (!doc) {
      throw new Error(
        `Document ${documentId} not found in dataset ${datasetId}`,
      );
    }

    return {
      status: doc.run ?? doc.status ?? 'unknown',
      progress: doc.progress ?? 0,
    };
  }

  async parseDocument(
    datasetId: string,
    documentIds: string[],
  ): Promise<void> {
    await this.client.post(`/api/v1/datasets/${datasetId}/chunks`, {
      document_ids: documentIds,
    });
  }

  async retrieveChunks(
    datasetId: string,
    query: string,
    topK = 5,
  ): Promise<Chunk[]> {
    const response = await this.client.post(
      '/api/v1/retrieval',
      {
        question: query,
        dataset_ids: [datasetId],
        top_k: topK,
        similarity_threshold: 0.0,
      },
    );

    const chunks: unknown[] = response.data?.data?.chunks ?? [];

    return chunks.map((raw: any) => ({
      id: raw.id ?? raw.chunk_id ?? '',
      content: raw.content ?? raw.content_with_weight ?? '',
      documentId: raw.document_id ?? raw.doc_id ?? '',
      score: raw.similarity ?? raw.score ?? 0,
      metadata: raw.metadata,
    }));
  }

  async getDocumentChunks(datasetId: string, documentId?: string): Promise<Chunk[]> {
    // Get all documents in dataset
    const docsResponse = await this.client.get(
      `/api/v1/datasets/${datasetId}/documents`,
    );

    const rawData = docsResponse.data?.data;
    const docs = Array.isArray(rawData)
      ? rawData
      : Array.isArray(rawData?.docs)
        ? rawData.docs
        : [];

    const targetDocs = documentId
      ? docs.filter((d: any) => d.id === documentId)
      : docs;

    const allChunks: Chunk[] = [];

    for (const doc of targetDocs) {
      try {
        const chunksResponse = await this.client.get(
          `/api/v1/datasets/${datasetId}/documents/${doc.id}/chunks`,
        );

        const rawChunks = chunksResponse.data?.data?.chunks ?? [];

        for (const raw of rawChunks) {
          allChunks.push({
            id: raw.id ?? '',
            content: raw.content ?? '',
            documentId: doc.id,
            score: 1,
            metadata: raw.metadata,
          });
        }
      } catch {
        this.logger.warn(`Failed to get chunks for document ${doc.id}`);
      }
    }

    return allChunks;
  }

  async createChatAssistant(
    name: string,
    datasetIds: string[],
  ): Promise<{ id: string }> {
    const response = await this.client.post('/api/v1/chats', {
      name,
      dataset_ids: datasetIds,
    });

    const id = response.data?.data?.id;

    if (!id) {
      this.logger.error('Failed to create chat assistant', {
        name,
        datasetIds,
      });
      throw new Error('RAGFlow returned no chat assistant ID');
    }

    return { id };
  }

  async createSession(chatId: string): Promise<{ id: string }> {
    const response = await this.client.post(
      `/api/v1/chats/${chatId}/sessions`,
      {},
    );

    const id = response.data?.data?.id;

    if (!id) {
      this.logger.error('Failed to create session', { chatId });
      throw new Error('RAGFlow returned no session ID');
    }

    return { id };
  }

  async chat(
    chatId: string,
    sessionId: string,
    query: string,
    stream = false,
  ): Promise<string> {
    const response = await this.client.post(
      `/api/v1/chats/${chatId}/completions`,
      {
        question: query,
        session_id: sessionId,
        stream,
      },
    );

    if (stream) {
      this.logger.warn(
        'Stream mode requested but non-streaming response returned; use chatStream for streaming',
      );
    }

    const answer =
      response.data?.data?.answer ?? response.data?.data?.choices?.[0]?.message?.content ?? '';

    return answer;
  }

  async deleteDataset(datasetId: string): Promise<void> {
    await this.client.delete('/api/v1/datasets', {
      data: { ids: [datasetId] },
    });
  }
}
