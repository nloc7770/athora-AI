import { Injectable, Logger } from '@nestjs/common';
import { LlmService } from '../../ai/llm.service';
import { RagflowService, Chunk } from '../../ragflow/ragflow.service';
import { SummaryOutput } from '../dto/generate.dto';

const SUMMARY_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    overview: { type: 'string' },
    chapters: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          keyPoints: { type: 'array', items: { type: 'string' } },
        },
        required: ['title', 'keyPoints'],
      },
    },
    takeaways: { type: 'array', items: { type: 'string' } },
  },
  required: ['title', 'overview', 'chapters', 'takeaways'],
};

@Injectable()
export class SummaryGenerator {
  private readonly logger = new Logger(SummaryGenerator.name);

  constructor(
    private readonly llmService: LlmService,
    private readonly ragflowService: RagflowService,
  ) {}

  async generate(datasetId: string, documentId: string): Promise<SummaryOutput> {
    // Use direct chunk access for generation (retrieval is for Q&A)
    const chunks = await this.ragflowService.getDocumentChunks(datasetId);

    if (chunks.length === 0) {
      throw new Error('No content available for summarization. Document may not be fully processed.');
    }

    return this.generateFromChunks(chunks);
  }

  private async generateFromChunks(chunks: Chunk[]): Promise<SummaryOutput> {
    const content = this.buildContentFromChunks(chunks);

    this.logger.log(`Generating summary from ${chunks.length} chunks (${content.length} chars)`);

    return this.llmService.generateJson<SummaryOutput>(
      [
        {
          role: 'user',
          content: [
            'Summarize this document into key points with chapter breakdown.',
            'Create a clear title, overview, chapter-by-chapter key points, and final takeaways.',
            '',
            'Document content:',
            content,
          ].join('\n'),
        },
      ],
      SUMMARY_SCHEMA,
    );
  }

  private buildContentFromChunks(chunks: Chunk[]): string {
    return chunks.map((c) => c.content).join('\n\n');
  }
}
