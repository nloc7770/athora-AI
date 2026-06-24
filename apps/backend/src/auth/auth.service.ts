import { Injectable, UnauthorizedException } from '@nestjs/common';
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

    return { user: data.user, session: data.session };
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
