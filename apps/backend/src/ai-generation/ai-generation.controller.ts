import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { AiGenerationService } from './ai-generation.service';
import { GenerateDto, GenerateSessionDto } from './dto/generate.dto';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('ai-generation')
@UseGuards(SupabaseAuthGuard)
export class AiGenerationController {
  constructor(private readonly aiGenerationService: AiGenerationService) {}

  @Post('generate')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  generate(
    @CurrentUser('id') userId: string,
    @Body() dto: GenerateDto,
  ) {
    return this.aiGenerationService.generate(userId, dto.documentId, dto.type);
  }

  @Post('generate-session')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  generateSession(
    @CurrentUser('id') userId: string,
    @Body() dto: GenerateSessionDto,
  ) {
    return this.aiGenerationService.generateForSession(userId, dto.sessionId, dto.type);
  }

  @Get('document/:documentId')
  getGenerationsByDocument(
    @CurrentUser('id') userId: string,
    @Param('documentId', ParseUUIDPipe) documentId: string,
  ) {
    return this.aiGenerationService.getGenerationsByDocument(userId, documentId);
  }

  @Get('session/:sessionId')
  getGenerationsBySession(
    @CurrentUser('id') userId: string,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
  ) {
    return this.aiGenerationService.getGenerationsBySession(userId, sessionId);
  }

  @Get(':id')
  getGeneration(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) generationId: string,
  ) {
    return this.aiGenerationService.getGeneration(userId, generationId);
  }
}
