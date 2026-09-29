import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import {
  applyPagination,
  ListPaginationDto,
} from '../common/decorators/pagination.decorator';
import { RagflowService } from '../ragflow/ragflow.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';

@Injectable()
export class SessionsService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly ragflowService: RagflowService,
  ) {}

  async findAll(userId: string, page?: ListPaginationDto) {
    const query = this.supabaseService
      .getAdminClient()
      .from('study_sessions')
      .select('*, documents(id)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    const { data, error } = await applyPagination(query, page);

    if (error) throw new NotFoundException(error.message);

    return data.map((s: any) => ({
      ...s,
      document_count: s.documents?.length ?? 0,
      documents: undefined,
    }));
  }

  async findOne(userId: string, id: string) {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('study_sessions')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !data) throw new NotFoundException('Session not found');

    const { data: docs } = await this.supabaseService
      .getAdminClient()
      .from('documents')
      .select('*')
      .eq('session_id', id)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    return { ...data, documents: docs ?? [] };
  }

  async create(userId: string, dto: CreateSessionDto) {
    // The RAGFlow dataset is created lazily on first document upload
    // (DocumentProcessorService.getOrCreateDataset). Creating it here made
    // session CRUD depend on RAGFlow being reachable, and orphaned a dataset
    // in RAGFlow whenever the insert below failed.
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('study_sessions')
      .insert({
        user_id: userId,
        name: dto.name,
        description: dto.description,
      })
      .select()
      .single();

    if (error) throw new NotFoundException(error.message);
    return data;
  }

  async update(userId: string, id: string, dto: UpdateSessionDto) {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('study_sessions')
      .update({ ...dto, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw new NotFoundException('Session not found');
    return data;
  }

  async archive(userId: string, id: string) {
    return this.update(userId, id, { name: undefined } as any);
  }

  async delete(userId: string, id: string) {
    const session = await this.findOne(userId, id);

    if (session.ragflow_dataset_id) {
      try {
        await this.ragflowService.deleteDataset(session.ragflow_dataset_id);
      } catch {
        // RAGFlow dataset may already be deleted
      }
    }

    const { error } = await this.supabaseService
      .getAdminClient()
      .from('study_sessions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw new NotFoundException('Session not found');
    return { deleted: true };
  }
}
