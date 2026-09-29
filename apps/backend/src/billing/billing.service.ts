import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { SupabaseService } from '../supabase/supabase.service';

/** Our subscriptions.status CHECK constraint only accepts these four. */
type SubStatus = 'active' | 'past_due' | 'canceled' | 'trialing';

/** Lemon Squeezy subscription status -> ours. Anything unlisted = no access. */
const LS_STATUS: Record<string, SubStatus> = {
  active: 'active',
  on_trial: 'trialing',
  past_due: 'past_due',
  paused: 'canceled',
  unpaid: 'canceled',
  cancelled: 'canceled',
  expired: 'canceled',
};

export interface Entitlement {
  plan: string;
  active: boolean;
  source: string | null;
  expiresAt: string | null;
  features: Record<string, unknown>;
}

const FREE: Entitlement = { plan: 'free', active: false, source: null, expiresAt: null, features: {} };

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly config: ConfigService,
  ) {}

  /**
   * The one question the app and the web client ask. Never throws for a
   * missing subscription — a free user is a valid answer, not an error.
   */
  async getEntitlement(userId: string): Promise<Entitlement> {
    const { data } = await this.supabase
      .getAdminClient()
      .from('subscriptions')
      .select('status, provider, current_period_end, plans(name, features)')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing'])
      .order('current_period_end', { ascending: false })
      .limit(1);

    const sub = data?.[0] as any;
    if (!sub) return FREE;

    // Trust the clock too, not just the status column: a provider that never
    // sends the expiry webhook would otherwise grant access forever.
    const expiresAt: string | null = sub.current_period_end ?? null;
    const notExpired = !expiresAt || new Date(expiresAt).getTime() > Date.now();

    return {
      plan: sub.plans?.name ?? 'free',
      active: notExpired,
      source: sub.provider ?? null,
      expiresAt,
      features: sub.plans?.features ?? {},
    };
  }

  /**
   * HMAC-SHA256 over the RAW body (main.ts sets rawBody: true). Must run
   * before the payload is trusted for anything.
   */
  verifyLemonSqueezySignature(rawBody: Buffer | undefined, signature: string | undefined): boolean {
    const secret = this.config.get<string>('LEMONSQUEEZY_WEBHOOK_SECRET');
    if (!secret || !rawBody || !signature) return false;

    const expected = createHmac('sha256', secret).update(rawBody).digest();
    let received: Buffer;
    try {
      received = Buffer.from(signature, 'hex');
    } catch {
      return false;
    }
    // timingSafeEqual throws on length mismatch, so gate on length first.
    return received.length === expected.length && timingSafeEqual(received, expected);
  }

  /** Map a verified Lemon Squeezy event onto our subscription row. */
  async applyLemonSqueezyEvent(payload: any): Promise<{ handled: boolean }> {
    const eventName: string = payload?.meta?.event_name ?? '';
    if (!eventName.startsWith('subscription_')) {
      return { handled: false }; // orders, licences, etc. — nothing to do yet
    }

    const attrs = payload?.data?.attributes ?? {};
    const userId: string | undefined = payload?.meta?.custom_data?.user_id;
    const providerSubId: string | undefined = payload?.data?.id?.toString();

    if (!userId || !providerSubId) {
      // Checkout was built without custom_data.user_id — we cannot attribute it.
      throw new BadRequestException('missing custom_data.user_id or subscription id');
    }

    const status = LS_STATUS[attrs.status] ?? 'canceled';
    const planId = await this.resolvePlanId('lemonsqueezy_variant_id', attrs.variant_id);
    if (!planId) {
      throw new BadRequestException(`no plan mapped to lemonsqueezy variant ${attrs.variant_id}`);
    }

    await this.upsertSubscription({
      userId,
      planId,
      status,
      provider: 'lemonsqueezy',
      providerSubId,
      // ends_at is set once cancelled; renews_at while it keeps billing.
      periodEnd: attrs.ends_at ?? attrs.renews_at ?? null,
      cancelAtPeriodEnd: Boolean(attrs.cancelled),
    });

    this.logger.log(`lemonsqueezy ${eventName}: user=${userId} status=${status}`);
    return { handled: true };
  }

  private async resolvePlanId(column: string, productId: unknown): Promise<string | null> {
    if (productId === null || productId === undefined) return null;
    const { data } = await this.supabase
      .getAdminClient()
      .from('plans')
      .select('id')
      .eq(column, String(productId))
      .limit(1);
    return (data?.[0] as any)?.id ?? null;
  }

  /**
   * Idempotent by (provider, provider_subscription_id): webhooks retry, and a
   * replayed event must update the same row rather than add a second one.
   */
  private async upsertSubscription(input: {
    userId: string;
    planId: string;
    status: SubStatus;
    provider: string;
    providerSubId: string;
    periodEnd: string | null;
    cancelAtPeriodEnd: boolean;
  }): Promise<void> {
    const client = this.supabase.getAdminClient();
    const row = {
      user_id: input.userId,
      plan_id: input.planId,
      status: input.status,
      provider: input.provider,
      provider_subscription_id: input.providerSubId,
      // NOT NULL in schema, so fall back to now() rather than writing null.
      current_period_end: input.periodEnd ?? new Date().toISOString(),
      cancel_at_period_end: input.cancelAtPeriodEnd,
      updated_at: new Date().toISOString(),
    };

    const { data: existing } = await client
      .from('subscriptions')
      .select('id')
      .eq('provider', input.provider)
      .eq('provider_subscription_id', input.providerSubId)
      .limit(1);

    const id = (existing?.[0] as any)?.id;
    const { error } = id
      ? await client.from('subscriptions').update(row).eq('id', id)
      : await client.from('subscriptions').insert(row);

    if (error) throw new Error(`subscription write failed: ${error.message}`);
  }
}
