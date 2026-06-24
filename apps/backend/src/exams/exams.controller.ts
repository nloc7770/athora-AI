import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ExamsService } from './exams.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { SubmitExamDto } from './dto/submit-exam.dto';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('exams')
@UseGuards(SupabaseAuthGuard)
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Get()
  findAll(@CurrentUser('id') userId: string) {
    return this.examsService.findAll(userId);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.examsService.findOne(userId, id);
  }

  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreateExamDto) {
    return this.examsService.create(userId, dto);
  }

  @Post(':id/submit')
  submitAttempt(
    @Param('id', ParseUUIDPipe) examId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: SubmitExamDto,
  ) {
    return this.examsService.submitAttempt(userId, examId, dto);
  }

  @Get(':id/attempts')
  getAttempts(
    @Param('id', ParseUUIDPipe) examId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.examsService.getAttempts(userId, examId);
  }
}
