import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

interface DailyActivity {
  date: string;
  count: number;
}

interface ExamTrend {
  date: string;
  score: number;
  exam_name: string;
}

export interface AnalyticsSummary {
  streak: number;
  totalStudyMinutes: number;
  flashcardsReviewed: number;
  averageExamScore: number;
  documentsUploaded: number;
  weeklyActivity: DailyActivity[];
  examTrend: ExamTrend[];
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getSummary(userId: string): Promise<AnalyticsSummary> {
    const client = this.supabaseService.getAdminClient();

    const [streak, studyTime, flashcards, examScore, documents, weeklyActivity, examTrend] =
      await Promise.all([
        this.calculateStreak(client, userId),
        this.getTotalStudyTime(client, userId),
        this.getFlashcardsReviewed(client, userId),
        this.getAverageExamScore(client, userId),
        this.getDocumentsUploaded(client, userId),
        this.getWeeklyActivity(client, userId),
        this.getExamTrend(client, userId),
      ]);

    return {
      streak,
      totalStudyMinutes: studyTime,
      flashcardsReviewed: flashcards,
      averageExamScore: examScore,
      documentsUploaded: documents,
      weeklyActivity,
      examTrend,
    };
  }

  private async calculateStreak(client: any, userId: string): Promise<number> {
    const { data } = await client
      .from('study_activities')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(90);

    if (!data || data.length === 0) return 0;

    const dates = new Set(
      data.map((a: any) => new Date(a.created_at).toISOString().split('T')[0])
    );

    let streak = 0;
    const today = new Date();

    for (let i = 0; i < 90; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      if (dates.has(dateStr)) {
        streak++;
      } else if (i === 0) {
        continue;
      } else {
        break;
      }
    }

    return streak;
  }

  private async getTotalStudyTime(client: any, userId: string): Promise<number> {
    const { data } = await client
      .from('study_activities')
      .select('duration_seconds')
      .eq('user_id', userId);

    if (!data) return 0;
    const totalSeconds = data.reduce((sum: number, a: any) => sum + (a.duration_seconds || 0), 0);
    return Math.round(totalSeconds / 60);
  }

  private async getFlashcardsReviewed(client: any, userId: string): Promise<number> {
    const { count } = await client
      .from('flashcards')
      .select('id', { count: 'exact', head: true })
      .in('set_id',
        client.from('flashcard_sets').select('id').eq('user_id', userId)
      )
      .not('last_reviewed', 'is', null);

    return count ?? 0;
  }

  private async getAverageExamScore(client: any, userId: string): Promise<number> {
    const { data } = await client
      .from('exam_attempts')
      .select('score')
      .eq('user_id', userId)
      .not('score', 'is', null);

    if (!data || data.length === 0) return 0;
    const avg = data.reduce((sum: number, a: any) => sum + Number(a.score), 0) / data.length;
    return Math.round(avg * 10) / 10;
  }

  private async getDocumentsUploaded(client: any, userId: string): Promise<number> {
    const { count } = await client
      .from('documents')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    return count ?? 0;
  }

  private async getWeeklyActivity(client: any, userId: string): Promise<DailyActivity[]> {
    const twelveWeeksAgo = new Date();
    twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84);

    const { data } = await client
      .from('study_activities')
      .select('created_at')
      .eq('user_id', userId)
      .gte('created_at', twelveWeeksAgo.toISOString())
      .order('created_at', { ascending: true });

    if (!data) return [];

    const countByDate = new Map<string, number>();
    for (const activity of data) {
      const date = new Date(activity.created_at).toISOString().split('T')[0];
      countByDate.set(date, (countByDate.get(date) || 0) + 1);
    }

    return Array.from(countByDate.entries()).map(([date, count]) => ({ date, count }));
  }

  private async getExamTrend(client: any, userId: string): Promise<ExamTrend[]> {
    const { data } = await client
      .from('exam_attempts')
      .select('score, completed_at, exams(name)')
      .eq('user_id', userId)
      .not('score', 'is', null)
      .order('completed_at', { ascending: true })
      .limit(20);

    if (!data) return [];

    return data.map((a: any) => ({
      date: a.completed_at,
      score: Number(a.score),
      exam_name: a.exams?.name ?? 'Unknown',
    }));
  }

  async getRecentActivities(userId: string, limit = 20) {
    const { data } = await this.supabaseService
      .getAdminClient()
      .from('study_activities')
      .select('id, activity_type, metadata, created_at')
      .eq('user_id', userId)
      .in('activity_type', ['document_upload', 'exam_generation', 'flashcard_generation'])
      .order('created_at', { ascending: false })
      .limit(limit);

    return data ?? [];
  }

  async logActivity(
    userId: string,
    activityType: string,
    durationSeconds: number = 0,
    sessionId?: string,
    metadata: Record<string, unknown> = {},
  ): Promise<void> {
    const client = this.supabaseService.getAdminClient();

    await client.from('study_activities').insert({
      user_id: userId,
      activity_type: activityType,
      session_id: sessionId ?? null,
      duration_seconds: durationSeconds,
      metadata,
    });
  }
}
