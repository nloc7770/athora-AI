import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async register(dto: RegisterDto) {
    const { data, error } = await this.supabaseService
      .getAuthClient()
      .auth.signUp({
        email: dto.email,
        password: dto.password,
        options: {
          data: { name: dto.name },
        },
      });

    if (error) {
      throw new UnauthorizedException(error.message);
    }

    return { user: data.user, session: data.session };
  }

  async login(dto: LoginDto) {
    const { data, error } = await this.supabaseService
      .getAuthClient()
      .auth.signInWithPassword({
        email: dto.email,
        password: dto.password,
      });

    if (error) {
      throw new UnauthorizedException(error.message);
    }

    // Fetch profile to include role
    const { data: profile } = await this.supabaseService
      .getAdminClient()
      .from('profiles')
      .select('role, name, avatar_url')
      .eq('id', data.user.id)
      .single();

    const user = {
      ...data.user,
      role: profile?.role ?? 'user',
      name: profile?.name ?? data.user.user_metadata?.name,
      avatar_url: profile?.avatar_url,
    };

    return { user, session: data.session };
  }

  async logout(token: string) {
    const { error } = await this.supabaseService
      .getClient()
      .auth.admin.signOut(token);

    if (error) {
      throw new UnauthorizedException(error.message);
    }

    return { message: 'Successfully logged out' };
  }

  async refreshSession(refreshToken: string) {
    const { data, error } = await this.supabaseService
      .getAuthClient()
      .auth.refreshSession({ refresh_token: refreshToken });

    if (error || !data.session) {
      throw new UnauthorizedException(error?.message ?? 'Failed to refresh session');
    }

    return { user: data.user, session: data.session };
  }

  async forgotPassword(email: string) {
    // Always return success to avoid email enumeration
    await this.supabaseService
      .getAuthClient()
      .auth.resetPasswordForEmail(email);

    return { message: 'If an account exists, a reset link has been sent.' };
  }

  async changePassword(
    userId: string,
    email: string,
    currentPassword: string,
    newPassword: string,
  ) {
    // Re-verify identity: a stolen session cookie alone must not be enough
    const { error: verifyError } = await this.supabaseService
      .getAuthClient()
      .auth.signInWithPassword({ email, password: currentPassword });
    // 400 not 401: the web client treats any 401 as an expired session and redirects to /login
    if (verifyError) {
      throw new BadRequestException('Current password is incorrect');
    }

    const { error } = await this.supabaseService
      .getAdminClient()
      .auth.admin.updateUserById(userId, { password: newPassword });
    if (error) {
      throw new BadRequestException(error.message);
    }

    return { message: 'Password updated' };
  }

  async getProfile(userId: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) {
      // Profile may not exist yet, return basic info from auth
      return { id: userId };
    }

    return data;
  }
}
