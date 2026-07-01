import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FlashcardsService } from './flashcards.service';
import { CreateFlashcardSetDto } from './dto/create-flashcard-set.dto';
import { CreateFlashcardDto } from './dto/create-flashcard.dto';
import { UpdateFlashcardDto } from './dto/update-flashcard.dto';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('flashcards')
@UseGuards(SupabaseAuthGuard)
export class FlashcardsController {
  constructor(private readonly flashcardsService: FlashcardsService) {}

  @Get('sets')
  findAllSets(
    @CurrentUser('id') userId: string,
    @Query('courseId') courseId?: string,
    @Query('documentId') documentId?: string,
    @Query('sessionId') sessionId?: string,
  ) {
    return this.flashcardsService.findAllSets(userId, { courseId, documentId, sessionId });
  }

  @Get('sets/:id')
  findSet(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.flashcardsService.findSet(userId, id);
  }

  @Post('sets')
  createSet(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateFlashcardSetDto,
  ) {
    return this.flashcardsService.createSet(userId, dto);
  }

  @Post('sets/:id/cards')
  createCard(
    @Param('id', ParseUUIDPipe) setId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateFlashcardDto,
  ) {
    return this.flashcardsService.createCard(userId, setId, dto);
  }

  @Patch('cards/:id')
  updateCard(
    @Param('id', ParseUUIDPipe) cardId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateFlashcardDto,
  ) {
    return this.flashcardsService.updateCard(userId, cardId, dto);
  }

  @Delete('sets/:id')
  deleteSet(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.flashcardsService.deleteSet(userId, id);
  }

  @Get('due')
  getDueCards(@CurrentUser('id') userId: string) {
    return this.flashcardsService.getDueCards(userId);
  }
}
