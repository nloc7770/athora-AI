import { Controller, Get, Post, Query, Param, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { AdminGuard } from '../common/guards/admin.guard';
import { SupabaseService } from '../supabase/supabase.service';
import { PaginationQueryDto } from './dto/admin.dto';

@Controller('admin/ai')
@UseGuards(AdminGuard)
export class AdminAiController {
  constructor(private readonly supabaseService: SupabaseService) {}

  @Get('generations')
  async getGenerations(@Query() query: PaginationQueryDto, @Query('type') type?: string, @Query('status') status?: string) {
    const { page = 1, limit = 20 } = query;
    const offset = (page - 1) * limit;
    const client = this.supabaseService.getAdminClient();

    let q = client.from('ai_generations')
      .select('*, profiles!ai_generations_user_id_fkey(name)', { count: 'exact' })
      .order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    if (type) q = q.eq('type', type);
    if (status) q = q.eq('status', status);

    const { data, count } = await q;
    return { data: data ?? [], total: count ?? 0, page, limit, totalPages: Math.ceil((count ?? 0) / limit) };
  }

  @Get('generations/stats')
  async getGenerationStats() {
    const client = this.supabaseService.getAdminClient();

    const [total, completed, failed, pending] = await Promise.all([
      client.from('ai_generations').select('*', { count: 'exact', head: true }),
      client.from('ai_generations').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
      client.from('ai_generations').select('*', { count: 'exact', head: true }).eq('status', 'error'),
      client.from('ai_generations').select('*', { count: 'exact', head: true }).in('status', ['pending', 'processing']),
    ]);

    return {
      total: total.count ?? 0,
      completed: completed.count ?? 0,
      failed: failed.count ?? 0,
      pending: pending.count ?? 0,
    };
  }

  @Get('chat/sessions')
  async getChatSessions(@Query() query: PaginationQueryDto, @Query('type') type?: string) {
    const { page = 1, limit = 20 } = query;
    const offset = (page - 1) * limit;
    const client = this.supabaseService.getAdminClient();

    let q = client.from('chat_sessions')
      .select('*, profiles!chat_sessions_user_id_fkey(name), chat_messages(count)', { count: 'exact' })
      .order('updated_at', { ascending: false }).range(offset, offset + limit - 1);

    if (type) q = q.eq('type', type);

    const { data, count } = await q;
    return { data: data ?? [], total: count ?? 0, page, limit, totalPages: Math.ceil((count ?? 0) / limit) };
  }

  @Get('chat/sessions/:id/messages')
  async getChatMessages(@Param('id', ParseUUIDPipe) id: string, @Query() query: PaginationQueryDto) {
    const { page = 1, limit = 50 } = query;
    const offset = (page - 1) * limit;
    const client = this.supabaseService.getAdminClient();

    const { data, count } = await client.from('chat_messages')
      .select('*', { count: 'exact' })
      .eq('session_id', id)
      .order('created_at', { ascending: true }).range(offset, offset + limit - 1);

    return { data: data ?? [], total: count ?? 0, page, limit, totalPages: Math.ceil((count ?? 0) / limit) };
  }
}
