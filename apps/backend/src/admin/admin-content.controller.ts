import { Controller, Get, Delete, Query, Param, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { AdminGuard } from '../common/guards/admin.guard';
import { SupabaseService } from '../supabase/supabase.service';
import { PaginationQueryDto } from './dto/admin.dto';

@Controller('admin/content')
@UseGuards(AdminGuard)
export class AdminContentController {
  constructor(private readonly supabaseService: SupabaseService) {}

  @Get('documents')
  async getDocuments(@Query() query: PaginationQueryDto, @Query('status') status?: string, @Query('type') type?: string) {
    const { page = 1, limit = 20, search } = query;
    const offset = (page - 1) * limit;
    const client = this.supabaseService.getAdminClient();

    let q = client.from('documents').select('*, profiles!documents_user_id_fkey(name)', { count: 'exact' })
      .order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    if (status) q = q.eq('status', status);
    if (type) q = q.eq('type', type);
    if (search) q = q.ilike('name', `%${search}%`);

    const { data, count } = await q;
    return { data: data ?? [], total: count ?? 0, page, limit, totalPages: Math.ceil((count ?? 0) / limit) };
  }

  @Delete('documents/:id')
  async deleteDocument(@Param('id', ParseUUIDPipe) id: string) {
    await this.supabaseService.getAdminClient().from('documents').delete().eq('id', id);
    return { deleted: true };
  }

  @Get('sessions')
  async getSessions(@Query() query: PaginationQueryDto) {
    const { page = 1, limit = 20, search } = query;
    const offset = (page - 1) * limit;
    const client = this.supabaseService.getAdminClient();

    let q = client.from('study_sessions').select('*, profiles!study_sessions_user_id_fkey(name)', { count: 'exact' })
      .order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    if (search) q = q.ilike('name', `%${search}%`);

    const { data, count } = await q;
    return { data: data ?? [], total: count ?? 0, page, limit, totalPages: Math.ceil((count ?? 0) / limit) };
  }

  @Get('flashcards')
  async getFlashcards(@Query() query: PaginationQueryDto) {
    const { page = 1, limit = 20 } = query;
    const offset = (page - 1) * limit;
    const client = this.supabaseService.getAdminClient();

    const { data, count } = await client.from('flashcard_sets')
      .select('*, profiles!flashcard_sets_user_id_fkey(name), flashcards(count)', { count: 'exact' })
      .order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    return { data: data ?? [], total: count ?? 0, page, limit, totalPages: Math.ceil((count ?? 0) / limit) };
  }

  @Get('exams')
  async getExams(@Query() query: PaginationQueryDto) {
    const { page = 1, limit = 20 } = query;
    const offset = (page - 1) * limit;
    const client = this.supabaseService.getAdminClient();

    const { data, count } = await client.from('exams')
      .select('*, profiles!exams_user_id_fkey(name), exam_attempts(count)', { count: 'exact' })
      .order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    return { data: data ?? [], total: count ?? 0, page, limit, totalPages: Math.ceil((count ?? 0) / limit) };
  }
}
