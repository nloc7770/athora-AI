import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class AdminDashboardService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getOverview() {
    const client = this.supabaseService.getAdminClient();

    const [users, documents, sessions, generations] = await Promise.all([
      client.from('profiles').select('*', { count: 'exact', head: true }),
      client.from('documents').select('*', { count: 'exact', head: true }),
      client.from('study_sessions').select('*', { count: 'exact', head: true }),
      client.from('ai_generations').select('*', { count: 'exact', head: true }),
    ]);

    return {
      totalUsers: users.count ?? 0,
      totalDocuments: documents.count ?? 0,
      totalSessions: sessions.count ?? 0,
      totalGenerations: generations.count ?? 0,
      activeToday: 0, // TODO: track via last_sign_in
    };
  }
}
