import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { SubmitExamDto } from './dto/submit-exam.dto';

@Injectable()
export class ExamsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll(userId: string) {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('exams')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new NotFoundException('Could not fetch exams');
    }

    return data;
  }

  async findOne(userId: string, examId: string) {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('exams')
      .select('*, exam_questions(*)')
      .eq('id', examId)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      throw new NotFoundException('Exam not found');
    }

    const rawQuestions = ((data as Record<string, unknown>).exam_questions ?? []) as Record<string, unknown>[];

    return {
      ...data,
      exam_questions: undefined,
      questions: rawQuestions.map((q) => ({
        id: q.id,
        text: q.question,
        type: q.type,
        options: (q.options as string[]) ?? [],
        correctAnswer: q.correct_answer,
        explanation: q.explanation ?? null,
        predictedLikelihood: q.predicted_likelihood ?? null,
      })),
    };
  }

  async create(userId: string, dto: CreateExamDto) {
    const { questions, ...examData } = dto;

    const { data: exam, error: examError } = await this.supabaseService
      .getAdminClient()
      .from('exams')
      .insert({ ...examData, user_id: userId })
      .select()
      .single();

    if (examError || !exam) {
      throw new NotFoundException(examError?.message ?? 'Could not create exam');
    }

    const questionsWithExamId = questions.map((q) => ({
      ...q,
      exam_id: exam.id,
    }));

    const { error: questionsError } = await this.supabaseService
      .getAdminClient()
      .from('exam_questions')
      .insert(questionsWithExamId);

    if (questionsError) {
      throw new NotFoundException(questionsError.message);
    }

    return this.findOne(userId, exam.id);
  }

  async submitAttempt(userId: string, examId: string, dto: SubmitExamDto) {
    const { data: questions, error: qError } = await this.supabaseService
      .getAdminClient()
      .from('exam_questions')
      .select('id, correct_answer')
      .eq('exam_id', examId);

    if (qError || !questions) {
      throw new NotFoundException('Exam questions not found');
    }

    const correctMap = new Map(
      questions.map((q) => [q.id, q.correct_answer]),
    );

    let correctCount = 0;
    for (const answer of dto.answers) {
      if (correctMap.get(answer.question_id) === answer.answer) {
        correctCount++;
      }
    }

    const totalQuestions = questions.length;
    const score =
      totalQuestions > 0
        ? parseFloat(((correctCount / totalQuestions) * 100).toFixed(2))
        : 0;

    const { data: attempt, error: attemptError } = await this.supabaseService
      .getAdminClient()
      .from('exam_attempts')
      .insert({
        exam_id: examId,
        user_id: userId,
        answers: dto.answers,
        score,
        time_spent: dto.time_spent ?? null,
      })
      .select()
      .single();

    if (attemptError) {
      throw new NotFoundException(attemptError.message);
    }

    return attempt;
  }

  async getAttempts(userId: string, examId: string) {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('exam_attempts')
      .select('*')
      .eq('exam_id', examId)
      .eq('user_id', userId)
      .order('completed_at', { ascending: false });

    if (error) {
      throw new NotFoundException('Could not fetch attempts');
    }

    return data;
  }
}
