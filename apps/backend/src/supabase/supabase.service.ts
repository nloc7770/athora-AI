import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private readonly client: SupabaseClient;
  private readonly authClient: SupabaseClient;

  constructor(private readonly configService: ConfigService) {
    const supabaseUrl = this.configService.getOrThrow<string>('SUPABASE_URL');
    const supabaseServiceKey =
      this.configService.getOrThrow<string>('SUPABASE_SERVICE_KEY');
    const supabaseAnonKey =
      this.configService.getOrThrow<string>('SUPABASE_ANON_KEY');

    this.client = createClient(supabaseUrl, supabaseServiceKey);
    this.authClient = createClient(supabaseUrl, supabaseAnonKey);
  }

  getClient(): SupabaseClient {
    return this.client;
  }

  getAdminClient(): SupabaseClient {
    return this.client;
  }

  getAuthClient(): SupabaseClient {
    return this.authClient;
  }
}
