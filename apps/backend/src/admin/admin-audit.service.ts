import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { PaginationQueryDto } from './dto/admin.dto';

@Injectable()
export class AdminAuditService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async log(
    adminId: string,
    action: string,
    resourceType: string,
    resourceId: string | null,
    details?: Record<string, unknown>,
  ) {
    const client = this.supabaseService.getAdminClient();

    await client.from('audit_logs').insert({
      admin_id: adminId,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      details: details ?? null,
    });
  }

  async findAll(query: PaginationQueryDto & {
    adminId?: string;
    action?: string;
    resourceType?: string;
  }) {
    const { page = 1, limit = 20, adminId, action, resourceType } = query;
    const offset = (page - 1) * limit;
    const client = this.supabaseService.getAdminClient();

    let q = client
      .from('audit_logs')
      .select('*, profiles!audit_logs_admin_id_fkey(name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (adminId) q = q.eq('admin_id', adminId);
    if (action) q = q.eq('action', action);
    if (resourceType) q = q.eq('resource_type', resourceType);

    const { data, count, error } = await q;

    return {
      data: data ?? [],
      total: count ?? 0,
      page,
      limit,
      totalPages: Math.ceil((count ?? 0) / limit),
    };
  }
}
