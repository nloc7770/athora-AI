import { Controller, Get, Post, Req, UseGuards, UnauthorizedException, Logger } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import type { Request } from 'express';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { BillingService } from './billing.service';

@Controller('billing')
export class BillingController {
  private readonly logger = new Logger(BillingController.name);

  constructor(private readonly billing: BillingService) {}

  /**
   * The single question the iOS app and the web client ask:
   * "does this user have Pro?" Provider-agnostic on purpose — swapping
   * Lemon Squeezy for Paddle later must not change the client.
   */
  @Get('entitlement')
  @UseGuards(SupabaseAuthGuard)
  async getEntitlement(@Req() req: any) {
    return this.billing.getEntitlement(req.user.id);
  }

  /**
   * Unauthenticated by design — Lemon Squeezy has no bearer token. The HMAC
   * signature over the raw body IS the authentication, so it is checked first
   * and nothing in the payload is touched before it passes.
   *
   * Exempted from CsrfGuard (see csrf.guard.ts) and from the throttler, since
   * a burst of provider retries hitting 429 would just make it retry harder.
   */
  @Post('webhooks/lemonsqueezy')
  @SkipThrottle()
  async lemonSqueezyWebhook(@Req() req: Request & { rawBody?: Buffer }) {
    const signature = req.headers['x-signature'];
    const ok = this.billing.verifyLemonSqueezySignature(
      req.rawBody,
      typeof signature === 'string' ? signature : undefined,
    );

    if (!ok) {
      this.logger.warn('lemonsqueezy webhook: bad signature, rejected');
      throw new UnauthorizedException('invalid signature');
    }

    // Return 200 even for events we do not care about, otherwise Lemon
    // Squeezy keeps retrying them for days.
    const result = await this.billing.applyLemonSqueezyEvent(req.body);
    return { received: true, ...result };
  }
}
