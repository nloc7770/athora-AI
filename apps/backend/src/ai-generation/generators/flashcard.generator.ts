import { Injectable, Logger } from '@nestjs/common';
import { LlmService } from '../../ai/llm.service';
import { RagflowService, Chunk } from '../../ragflow/ragflow.service';
import { SupabaseService } from '../../supabase/supabase.service';
import { FlashcardOutput } from '../dto/generate.dto';

const FLASHCARD_SCHEMA = {
  type: 'object',
  properties: {
    cards: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          front: { type: 'string' },
          back: { type: 'string' },
          difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
        },
        required: ['front', 'back', 'difficulty'],
      },
    },
  },
  required: ['cards'],
};

@Injectable()
export class FlashcardGenerator {
  private readonly logger = new Logger(FlashcardGenerator.name);

  constructor(
    private readonly llmService: LlmService,
    private readonly ragflowService: RagflowService,
    private readonly supabaseService: SupabaseService,
  ) {}

  async generate(
    datasetId: string,
    documentId: string | null,
    userId: string,
  ): Promise<FlashcardOutput> {
    const chunks = await this.ragflowService.getDocumentChunks(
      datasetId,
    );

    const content = this.buildContentFromChunks(chunks);

    this.logger.log(`Generating flashcards from ${chunks.length} chunks`);

    const output = await this.llmService.generateJson<FlashcardOutput>(
      [
        {
          role: 'user',
          content: [
            'Generate flashcards from this content.',
            'Create question-answer pairs covering key concepts.',
            'Include a mix of easy, medium, and hard difficulty cards.',
            'Front should be the question/prompt, back should be the answer/explanation.',
            '',
            'Document content:',
            content,
          ].join('\n'),
        },
      ],
      FLASHCARD_SCHEMA,
    );

    await this.persistFlashcards(userId, documentId, output);

    return output;
  }

  private async persistFlashcards(
    userId: string,
    documentId: string | null,
    output: FlashcardOutput,
  ): Promise<void> {
    const { data: set, error: setError } = await this.supabaseService
      .getAdminClient()
      .from('flashcard_sets')
      .insert({
        user_id: userId,
        title: 'AI Generated Flashcards',
        document_id: documentId,
        source: 'ai_generation',
      })
      .select()
      .single();

    if (setError || !set) {
      this.logger.error('Failed to create flashcard set', { setError });
      return;
    }

    const flashcards = output.cards.map((card) => ({
      set_id: set.id,
      front: card.front,
      back: card.back,
      difficulty: card.difficulty,
    }));

    const { error: cardsError } = await this.supabaseService
      .getAdminClient()
      .from('flashcards')
      .insert(flashcards);

    if (cardsError) {
      this.logger.error('Failed to insert flashcards', { cardsError });
    }
  }

  private buildContentFromChunks(chunks: Chunk[]): string {
    return chunks.map((c) => c.content).join('\n\n');
  }
}
