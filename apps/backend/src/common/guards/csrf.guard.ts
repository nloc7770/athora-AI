import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';

/**
 * CSRF protection via custom header check.
 * Browsers won't add custom headers on cross-origin form submissions,
 * so requiring X-Requested-With effectively prevents CSRF for JSON APIs.
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  private readonly safeMethods = new Set(['GET', 'HEAD', 'OPTIONS']);

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    // Safe methods don't need CSRF protection
    if (this.safeMethods.has(request.method)) {
      return true;
    }

    // Provider webhooks (Lemon Squeezy, Apple) cannot send a custom header.
    // They authenticate with a cryptographic signature over the raw body,
    // which each handler verifies before touching the payload. The header
    // heuristic exists to stop browsers replaying a session cookie; these
    // routes have no session to replay, so it buys nothing here.
    if (request.path?.startsWith('/billing/webhooks/')) {
      return true;
    }

    // Require custom header on state-changing requests
    const xRequestedWith = request.headers['x-requested-with'];
    return xRequestedWith === 'XMLHttpRequest';
  }
}
