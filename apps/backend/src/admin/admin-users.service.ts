import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { PaginationQueryDto, AdminUpdateUserDto, BanUserDto } from './dto/admin.dto';

@Injectable()
export class AdminUsersService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll(query: PaginationQueryDto & { role?: string }) {
    const { page = 1, limit = 20, search, role, sortBy = 'created_at', sortOrder = 'desc' } = query;
    const offset = (page - 1) * limit;
    const client = this.supabaseService.getAdminClient();

    let q = client
      .from('profiles')
      .select('*', { count: 'exact' });

    if (search) {
      q = q.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }
    if (role) {
      q = q.eq('role', role);
    }

    q = q.order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1);

    const { data, count, error } = await q;

    if (error) throw new NotFoundException(error.message);

    return {
      data: data ?? [],
      total: count ?? 0,
      page,
      limit,
      totalPages: Math.ceil((count ?? 0) / limit),
    };
  }

  async findOne(userId: string) {
    const client = this.supabaseService.getAdminClient();

    const { data: user, error } = await client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !user) throw new NotFoundException('User not found');

    // Get stats
    const [docs, sessions, flashcards, exams] = await Promise.all([
      client.from('documents').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      client.from('study_sessions').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      client.from('flashcard_sets').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      client.from('exams').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    ]);

    return {
      ...user,
      stats: {
        documents: docs.count ?? 0,
        sessions: sessions.count ?? 0,
        flashcardSets: flashcards.count ?? 0,
        exams: exams.count ?? 0,
      },
    };
  }

  async update(userId: string, dto: AdminUpdateUserDto) {
    const client = this.supabaseService.getAdminClient();

    const { data, error } = await client
      .from('profiles')
      .update({ ...dto, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw new NotFoundException(error.message);
    return data;
  }

  async ban(userId: string, dto: BanUserDto) {
    const client = this.supabaseService.getAdminClient();

    const { error } = await client
      .from('profiles')
      .update({
        banned_at: new Date().toISOString(),
        ban_reason: dto.reason,
      })
      .eq('id', userId);

    if (error) throw new NotFoundException(error.message);
    return { banned: true };
  }

  async unban(userId: string) {
    const client = this.supabaseService.getAdminClient();

    const { error } = await client
      .from('profiles')
      .update({ banned_at: null, ban_reason: null })
      .eq('id', userId);

    if (error) throw new NotFoundException(error.message);
    return { unbanned: true };
  }
}
