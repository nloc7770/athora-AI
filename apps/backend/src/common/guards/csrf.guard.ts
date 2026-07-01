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

    // Require custom header on state-changing requests
    const xRequestedWith = request.headers['x-requested-with'];
    return xRequestedWith === 'XMLHttpRequest';
  }
}
