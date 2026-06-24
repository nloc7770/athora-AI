import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getProfile(userId: string) {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) {
      throw new NotFoundException('User profile not found');
    }

    return data;
  }

  async updateProfile(userId: string, dto: UpdateUserDto) {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('profiles')
      .update({ ...dto, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw new NotFoundException('User profile not found');
    }

    return data;
  }
}
