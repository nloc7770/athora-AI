import { Injectable, Logger } from '@nestjs/common';
import { LlmService } from '../../ai/llm.service';
import { RagflowService, Chunk } from '../../ragflow/ragflow.service';
import { SupabaseService } from '../../supabase/supabase.service';
import { ExamOutput } from '../dto/generate.dto';

const EXAM_SCHEMA = {
  type: 'object',
  properties: {
    questions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          question: { type: 'string' },
          type: {
            type: 'string',
            enum: ['multiple_choice', 'true_false', 'short_answer'],
          },
          options: { type: 'array', items: { type: 'string' } },
          correctAnswer: { type: 'string' },
          explanation: { type: 'string' },
          predictedLikelihood: {
            type: 'string',
            enum: ['high', 'medium', 'low'],
          },
        },
        required: [
          'question',
          'type',
          'correctAnswer',
          'explanation',
          'predictedLikelihood',
        ],
      },
    },
  },
  required: ['questions'],
};

@Injectable()
export class ExamGenerator {
  private readonly logger = new Logger(ExamGenerator.name);

  constructor(
    private readonly llmService: LlmService,
    private readonly ragflowService: RagflowService,
    private readonly supabaseService: SupabaseService,
  ) {}

  async generate(
    datasetId: string,
    documentId: string | null,
    userId: string,
  ): Promise<ExamOutput> {
    const chunks = await this.ragflowService.getDocumentChunks(
      datasetId,
    );

    const content = this.buildContentFromChunks(chunks);

    this.logger.log(`Generating exam from ${chunks.length} chunks`);

    const output = await this.llmService.generateJson<ExamOutput>(
      [
        {
          role: 'user',
          content: [
            'Generate exam questions from this content.',
            'Mix multiple choice, true/false, and short answer questions.',
            'Mark predicted importance/likelihood of each question appearing in a real exam.',
            'For multiple choice, provide 4 options. For true/false, options should be ["True", "False"].',
            'Provide a clear explanation for each correct answer.',
            '',
            'Document content:',
            content,
          ].join('\n'),
        },
      ],
      EXAM_SCHEMA,
    );

    await this.persistExam(userId, documentId, output);

    return output;
  }

  private async persistExam(
    userId: string,
    documentId: string | null,
    output: ExamOutput,
  ): Promise<void> {
    const { data: exam, error: examError } = await this.supabaseService
      .getAdminClient()
      .from('exams')
      .insert({
        user_id: userId,
        title: 'AI Generated Exam',
        document_id: documentId,
        source: 'ai_generation',
        total_questions: output.questions.length,
      })
      .select()
      .single();

    if (examError || !exam) {
      this.logger.error('Failed to create exam', { examError });
      return;
    }

    const questions = output.questions.map((q) => ({
      exam_id: exam.id,
      question: q.question,
      type: q.type,
      options: q.options ?? null,
      correct_answer: q.correctAnswer,
      explanation: q.explanation,
      predicted_likelihood: q.predictedLikelihood,
    }));

    const { error: questionsError } = await this.supabaseService
      .getAdminClient()
      .from('exam_questions')
      .insert(questions);

    if (questionsError) {
      this.logger.error('Failed to insert exam questions', { questionsError });
    }
  }

  private buildContentFromChunks(chunks: Chunk[]): string {
    return chunks.map((c) => c.content).join('\n\n');
  }
}
