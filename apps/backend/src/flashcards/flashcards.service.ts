import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateFlashcardSetDto } from './dto/create-flashcard-set.dto';
import { CreateFlashcardDto } from './dto/create-flashcard.dto';
import { UpdateFlashcardDto } from './dto/update-flashcard.dto';

@Injectable()
export class FlashcardsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async findAllSets(
    userId: string,
    filters?: { courseId?: string; documentId?: string; sessionId?: string },
  ) {
    let query = this.supabaseService
      .getAdminClient()
      .from('flashcard_sets')
      .select('*, flashcards(count)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (filters?.courseId) {
      query = query.eq('course_id', filters.courseId);
    }
    if (filters?.documentId) {
      query = query.eq('document_id', filters.documentId);
    }
    if (filters?.sessionId) {
      query = query.eq('session_id', filters.sessionId);
    }

    const { data, error } = await query;

    if (error) {
      throw new NotFoundException('Could not fetch flashcard sets');
    }

    return data;
  }

  async findSet(userId: string, setId: string) {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('flashcard_sets')
      .select('*, flashcards(*)')
      .eq('id', setId)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      throw new NotFoundException('Flashcard set not found');
    }

    return data;
  }

  async createSet(userId: string, dto: CreateFlashcardSetDto) {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('flashcard_sets')
      .insert({ ...dto, user_id: userId })
      .select()
      .single();

    if (error) {
      throw new NotFoundException(error.message);
    }

    return data;
  }

  private async verifySetOwnership(setId: string, userId: string): Promise<void> {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('flashcard_sets')
      .select('id')
      .eq('id', setId)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      throw new ForbiddenException('You do not have access to this flashcard set');
    }
  }

  async createCard(userId: string, setId: string, dto: CreateFlashcardDto) {
    await this.verifySetOwnership(setId, userId);

    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('flashcards')
      .insert({ ...dto, set_id: setId })
      .select()
      .single();

    if (error) {
      throw new NotFoundException(error.message);
    }

    return data;
  }

  async updateCard(userId: string, cardId: string, dto: UpdateFlashcardDto) {
    // Fetch the card to get its set_id, then verify ownership
    const { data: card, error: cardError } = await this.supabaseService
      .getAdminClient()
      .from('flashcards')
      .select('set_id')
      .eq('id', cardId)
      .single();

    if (cardError || !card) {
      throw new NotFoundException('Flashcard not found');
    }

    await this.verifySetOwnership(card.set_id, userId);

    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('flashcards')
      .update(dto)
      .eq('id', cardId)
      .select()
      .single();

    if (error) {
      throw new NotFoundException('Flashcard not found');
    }

    return data;
  }

  async deleteSet(userId: string, setId: string) {
    const { error } = await this.supabaseService
      .getAdminClient()
      .from('flashcard_sets')
      .delete()
      .eq('id', setId)
      .eq('user_id', userId);

    if (error) {
      throw new NotFoundException('Flashcard set not found');
    }

    return { deleted: true };
  }

  async getDueCards(userId: string) {
    const now = new Date().toISOString();

    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('flashcards')
      .select('*, flashcard_sets!inner(user_id)')
      .eq('flashcard_sets.user_id', userId)
      .or(`next_review.is.null,next_review.lte.${now}`)
      .order('next_review', { ascending: true, nullsFirst: true });

    if (error) {
      throw new NotFoundException('Could not fetch due cards');
    }

    return data;
  }
}
