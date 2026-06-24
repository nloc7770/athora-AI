import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@Injectable()
export class CoursesService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll(userId: string) {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('courses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new NotFoundException('Could not fetch courses');
    }

    return data;
  }

  async findOne(userId: string, courseId: string) {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      throw new NotFoundException('Course not found');
    }

    return data;
  }

  async create(userId: string, dto: CreateCourseDto) {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('courses')
      .insert({ ...dto, user_id: userId })
      .select()
      .single();

    if (error) {
      throw new NotFoundException(error.message);
    }

    return data;
  }

  async update(userId: string, courseId: string, dto: UpdateCourseDto) {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('courses')
      .update({ ...dto, updated_at: new Date().toISOString() })
      .eq('id', courseId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new NotFoundException('Course not found');
    }

    return data;
  }

  async delete(userId: string, courseId: string) {
    const { error } = await this.supabaseService
      .getAdminClient()
      .from('courses')
      .delete()
      .eq('id', courseId)
      .eq('user_id', userId);

    if (error) {
      throw new NotFoundException('Course not found');
    }

    return { deleted: true };
  }
}
