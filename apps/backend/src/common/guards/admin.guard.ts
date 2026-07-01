import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly supabaseService: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    if (!request.user) {
      const token = this.extractToken(request);
      if (!token) {
        throw new UnauthorizedException('Missing or invalid authorization token');
      }

      const { data: { user }, error } = await this.supabaseService
        .getAuthClient()
        .auth.getUser(token);

      if (error || !user) {
        throw new UnauthorizedException('Invalid or expired token');
      }

      request.user = user;
    }

    const { data: profile, error } = await this.supabaseService
      .getAdminClient()
      .from('profiles')
      .select('role, banned_at')
      .eq('id', request.user.id)
      .single();

    if (error || !profile) {
      throw new ForbiddenException('Unable to verify user role');
    }

    if (profile.banned_at !== null) {
      throw new ForbiddenException('Your account has been suspended');
    }

    const adminRoles = ['admin', 'super_admin'];

    if (!adminRoles.includes(profile.role)) {
      throw new ForbiddenException(
        'Admin access required. Your role does not have permission to access this resource.',
      );
    }

    return true;
  }

  private extractToken(request: any): string | null {
    const authHeader = request.headers['authorization'];
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.replace('Bearer ', '');
    }
    return request.cookies?.['athora-token'] ?? null;
  }
}
