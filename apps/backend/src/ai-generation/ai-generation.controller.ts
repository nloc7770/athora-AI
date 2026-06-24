import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AiGenerationService } from './ai-generation.service';
import { GenerateDto } from './dto/generate.dto';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('ai-generation')
@UseGuards(SupabaseAuthGuard)
export class AiGenerationController {
  constructor(private readonly aiGenerationService: AiGenerationService) {}

  @Post('generate')
  generate(
    @CurrentUser('id') userId: string,
    @Body() dto: GenerateDto,
  ) {
    return this.aiGenerationService.generate(userId, dto.documentId, dto.type);
  }

  @Get(':id')
  getGeneration(
    @CurrentUser('id') userId: string,
    @Param('id') generationId: string,
  ) {
    return this.aiGenerationService.getGeneration(userId, generationId);
  }

  @Get('document/:documentId')
  getGenerationsByDocument(
    @CurrentUser('id') userId: string,
    @Param('documentId') documentId: string,
  ) {
    return this.aiGenerationService.getGenerationsByDocument(userId, documentId);
  }
}
