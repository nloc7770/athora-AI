import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { PaginationQueryDto, CreditAdjustDto } from './dto/admin.dto';

@Injectable()
export class AdminCreditsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 20 } = query;
    const offset = (page - 1) * limit;
    const client = this.supabaseService.getAdminClient();

    const { data, count, error } = await client
      .from('credit_accounts')
      .select('*, profiles(name)', { count: 'exact' })
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new NotFoundException(error.message);

    return {
      data: data ?? [],
      total: count ?? 0,
      page,
      limit,
      totalPages: Math.ceil((count ?? 0) / limit),
    };
  }

  async getTransactions(userId: string, query: PaginationQueryDto) {
    const { page = 1, limit = 20 } = query;
    const offset = (page - 1) * limit;
    const client = this.supabaseService.getAdminClient();

    // Get account first
    const { data: account } = await client
      .from('credit_accounts')
      .select('id, balance')
      .eq('user_id', userId)
      .single();

    if (!account) throw new NotFoundException('Credit account not found');

    const { data, count, error } = await client
      .from('credit_transactions')
      .select('*', { count: 'exact' })
      .eq('account_id', account.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new NotFoundException(error.message);

    return {
      account,
      transactions: data ?? [],
      total: count ?? 0,
      page,
      limit,
    };
  }

  async adjust(userId: string, dto: CreditAdjustDto) {
    const client = this.supabaseService.getAdminClient();

    // Get or create account
    let { data: account } = await client
      .from('credit_accounts')
      .select('id, balance')
      .eq('user_id', userId)
      .single();

    if (!account) {
      const { data: newAccount, error: createErr } = await client
        .from('credit_accounts')
        .insert({ user_id: userId, balance: 0 })
        .select()
        .single();

      if (createErr || !newAccount) throw new BadRequestException(createErr?.message ?? 'Failed to create account');
      account = newAccount;
    }

    const currentBalance = account!.balance as number;
    const accountId = account!.id as string;
    const newBalance = currentBalance + dto.amount;
    if (newBalance < 0) {
      throw new BadRequestException('Insufficient credits — balance would go negative');
    }

    // Update balance
    const { error: updateErr } = await client
      .from('credit_accounts')
      .update({
        balance: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq('id', accountId);

    if (updateErr) throw new BadRequestException(updateErr.message);

    // Insert transaction
    const { data: transaction, error: txErr } = await client
      .from('credit_transactions')
      .insert({
        account_id: accountId,
        amount: dto.amount,
        type: dto.type ?? 'admin_adj',
        description: dto.reason,
        balance_after: newBalance,
      })
      .select()
      .single();

    if (txErr) throw new BadRequestException(txErr.message);

    return { balance: newBalance, transaction };
  }
}
