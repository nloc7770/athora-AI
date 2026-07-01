import { Controller, Get, Post, Patch, Delete, Query, Param, Body, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { AdminGuard } from '../common/guards/admin.guard';
import { SupabaseService } from '../supabase/supabase.service';

@Controller('admin/system')
@UseGuards(AdminGuard)
export class AdminSystemController {
  constructor(private readonly supabaseService: SupabaseService) {}

  // Feature Flags
  @Get('feature-flags')
  async getFeatureFlags() {
    const { data } = await this.supabaseService.getAdminClient()
      .from('feature_flags').select('*').order('name', { ascending: true });
    return data ?? [];
  }

  @Post('feature-flags')
  async createFlag(@Body() body: Record<string, unknown>) {
    const { data } = await this.supabaseService.getAdminClient()
      .from('feature_flags').insert(body).select().single();
    return data;
  }

  @Patch('feature-flags/:id')
  async updateFlag(@Param('id', ParseUUIDPipe) id: string, @Body() body: Record<string, unknown>) {
    const { data } = await this.supabaseService.getAdminClient()
      .from('feature_flags').update({ ...body, updated_at: new Date().toISOString() }).eq('id', id).select().single();
    return data;
  }

  @Delete('feature-flags/:id')
  async deleteFlag(@Param('id', ParseUUIDPipe) id: string) {
    await this.supabaseService.getAdminClient().from('feature_flags').delete().eq('id', id);
    return { deleted: true };
  }

  // System Settings
  @Get('settings')
  async getSettings() {
    const { data } = await this.supabaseService.getAdminClient()
      .from('system_settings').select('*').order('key', { ascending: true });
    return data ?? [];
  }

  @Patch('settings/:key')
  async updateSetting(@Param('key') key: string, @Body() body: { value: unknown }) {
    const { data } = await this.supabaseService.getAdminClient()
      .from('system_settings').upsert({ key, value: body.value, updated_at: new Date().toISOString() }).select().single();
    return data;
  }

  // Health
  @Get('health')
  async getHealth() {
    const client = this.supabaseService.getAdminClient();
    let dbOk = false;
    try {
      const { error } = await client.from('profiles').select('id', { count: 'exact', head: true });
      dbOk = !error;
    } catch { dbOk = false; }

    return {
      api: true,
      database: dbOk,
      redis: true, // TODO: actual redis ping
      timestamp: new Date().toISOString(),
    };
  }
}
