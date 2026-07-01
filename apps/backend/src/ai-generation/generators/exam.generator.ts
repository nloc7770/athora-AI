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
            enum: ['multiple_choice'],
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
    sessionId?: string | null,
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
            'Generate multiple choice exam questions from this content.',
            'All questions must be multiple_choice type with exactly 4 options.',
            'Mark predicted importance/likelihood of each question appearing in a real exam.',
            'For each question, provide 4 answer options where exactly one is correct.',
            'Provide a clear explanation for each correct answer.',
            '',
            'Document content:',
            content,
          ].join('\n'),
        },
      ],
      EXAM_SCHEMA,
    );

    const examId = await this.persistExam(userId, documentId, sessionId, output);

    return { ...output, examId };
  }

  private async persistExam(
    userId: string,
    documentId: string | null,
    sessionId: string | null | undefined,
    output: ExamOutput,
  ): Promise<string | undefined> {
    const insertData: Record<string, unknown> = {
      user_id: userId,
      name: 'AI Generated Exam',
      question_count: output.questions.length,
    };
    if (documentId) insertData.document_id = documentId;
    if (sessionId) insertData.session_id = sessionId;

    const { data: exam, error: examError } = await this.supabaseService
      .getAdminClient()
      .from('exams')
      .insert(insertData)
      .select()
      .single();

    if (examError || !exam) {
      this.logger.error('Failed to create exam', { examError });
      return undefined;
    }

    const questions = output.questions.map((q, index) => ({
      exam_id: exam.id,
      question: q.question,
      type: q.type,
      options: q.options ?? null,
      correct_answer: q.correctAnswer,
      explanation: q.explanation,
      order_index: index,
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
