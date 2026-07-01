import { Controller, Get, Post, Patch, Delete, Query, Param, Body, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { AdminGuard } from '../common/guards/admin.guard';
import { SupabaseService } from '../supabase/supabase.service';
import { PaginationQueryDto } from './dto/admin.dto';

@Controller('admin/billing')
@UseGuards(AdminGuard)
export class AdminBillingController {
  constructor(private readonly supabaseService: SupabaseService) {}

  // Plans
  @Get('plans')
  async getPlans() {
    const { data } = await this.supabaseService.getAdminClient()
      .from('plans').select('*').order('price_monthly', { ascending: true });
    return data ?? [];
  }

  @Patch('plans/:id')
  async updatePlan(@Param('id', ParseUUIDPipe) id: string, @Body() body: Record<string, unknown>) {
    const { data } = await this.supabaseService.getAdminClient()
      .from('plans').update(body).eq('id', id).select().single();
    return data;
  }

  // Subscriptions
  @Get('subscriptions')
  async getSubscriptions(@Query() query: PaginationQueryDto, @Query('status') status?: string) {
    const { page = 1, limit = 20 } = query;
    const offset = (page - 1) * limit;
    const client = this.supabaseService.getAdminClient();

    let q = client.from('subscriptions')
      .select('*, profiles!subscriptions_user_id_fkey(name), plans(name, price_monthly)', { count: 'exact' })
      .order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    if (status) q = q.eq('status', status);

    const { data, count } = await q;
    return { data: data ?? [], total: count ?? 0, page, limit, totalPages: Math.ceil((count ?? 0) / limit) };
  }

  // Coupons
  @Get('coupons')
  async getCoupons(@Query() query: PaginationQueryDto) {
    const { page = 1, limit = 20 } = query;
    const offset = (page - 1) * limit;
    const client = this.supabaseService.getAdminClient();

    const { data, count } = await client.from('coupons')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    return { data: data ?? [], total: count ?? 0, page, limit, totalPages: Math.ceil((count ?? 0) / limit) };
  }

  @Post('coupons')
  async createCoupon(@Body() body: Record<string, unknown>) {
    const { data } = await this.supabaseService.getAdminClient()
      .from('coupons').insert(body).select().single();
    return data;
  }

  @Patch('coupons/:id')
  async updateCoupon(@Param('id', ParseUUIDPipe) id: string, @Body() body: Record<string, unknown>) {
    const { data } = await this.supabaseService.getAdminClient()
      .from('coupons').update(body).eq('id', id).select().single();
    return data;
  }

  @Delete('coupons/:id')
  async deactivateCoupon(@Param('id', ParseUUIDPipe) id: string) {
    await this.supabaseService.getAdminClient()
      .from('coupons').update({ is_active: false }).eq('id', id);
    return { deactivated: true };
  }
}
