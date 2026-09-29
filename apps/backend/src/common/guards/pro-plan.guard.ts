import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../../supabase/supabase.service';

@Injectable()
export class ProPlanGuard implements CanActivate {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // While the product is free there is nothing to sell, so plan gating only
    // locks users out of their own data. Set BILLING_ENABLED=true to restore.
    if (this.config.get<string>('BILLING_ENABLED', 'true') === 'false') {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.id) {
      throw new ForbiddenException('Authentication required');
    }

    const client = this.supabaseService.getAdminClient();

    const { data: subscription } = await client
      .from('subscriptions')
      .select('plan_id, plans(features)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!subscription) {
      throw new ForbiddenException('Pro plan required for analytics');
    }

    const features = (subscription as any).plans?.features;
    if (!features?.analytics) {
      throw new ForbiddenException('Pro plan required for analytics');
    }

    return true;
  }
}
