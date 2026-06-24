import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';

@Injectable()
export class DocumentsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll(userId: string, filters?: { courseId?: string; type?: string; sessionId?: string }) {
    let query = this.supabaseService
      .getAdminClient()
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (filters?.courseId) {
      query = query.eq('course_id', filters.courseId);
    }

    if (filters?.type) {
      query = query.eq('type', filters.type);
    }

    if (filters?.sessionId) {
      query = query.eq('session_id', filters.sessionId);
    }

    const { data, error } = await query;

    if (error) {
      throw new NotFoundException('Could not fetch documents');
    }

    return data;
  }

  async findOne(userId: string, id: string) {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('documents')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      throw new NotFoundException('Document not found');
    }

    return data;
  }

  async create(userId: string, dto: CreateDocumentDto) {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('documents')
      .insert({ ...dto, user_id: userId })
      .select()
      .single();

    if (error) {
      throw new NotFoundException(error.message);
    }

    return data;
  }

  async update(userId: string, id: string, dto: UpdateDocumentDto) {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('documents')
      .update({ ...dto, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new NotFoundException('Document not found');
    }

    return data;
  }

  async delete(userId: string, id: string) {
    const { error } = await this.supabaseService
      .getAdminClient()
      .from('documents')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      throw new NotFoundException('Document not found');
    }

    return { deleted: true };
  }
}
