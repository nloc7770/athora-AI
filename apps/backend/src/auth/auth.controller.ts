import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshDto } from './dto/refresh.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

const COOKIE_NAME = 'athora-token';
const REFRESH_COOKIE_NAME = 'athora-refresh';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(dto);

    res.cookie(COOKIE_NAME, result.session.access_token, COOKIE_OPTIONS);
    res.cookie(REFRESH_COOKIE_NAME, result.session.refresh_token, COOKIE_OPTIONS);

    return result;
  }

  @Post('refresh')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME] ?? req.body?.refresh_token;

    if (!refreshToken) {
      res.clearCookie(COOKIE_NAME, COOKIE_OPTIONS);
      res.clearCookie(REFRESH_COOKIE_NAME, COOKIE_OPTIONS);
      return { error: 'No refresh token' };
    }

    const result = await this.authService.refreshSession(refreshToken);

    res.cookie(COOKIE_NAME, result.session.access_token, COOKIE_OPTIONS);
    res.cookie(REFRESH_COOKIE_NAME, result.session.refresh_token, COOKIE_OPTIONS);

    return result;
  }

  @Post('forgot-password')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('logout')
  @UseGuards(SupabaseAuthGuard)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token =
      req.headers['authorization']?.replace('Bearer ', '') ??
      req.cookies?.['athora-token'] ??
      '';
    res.clearCookie(COOKIE_NAME, COOKIE_OPTIONS);
    res.clearCookie(REFRESH_COOKIE_NAME, COOKIE_OPTIONS);
    return this.authService.logout(token);
  }

  @Get('me')
  @UseGuards(SupabaseAuthGuard)
  getMe(@CurrentUser('id') userId: string) {
    return this.authService.getProfile(userId);
  }
}
