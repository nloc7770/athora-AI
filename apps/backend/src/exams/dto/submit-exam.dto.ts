import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AnswerEntryDto {
  // Accept either naming. At least one must be present: question_id is required
  // only when questionId is absent, and vice versa.
  @ValidateIf((o: AnswerEntryDto) => o.questionId === undefined)
  @IsString()
  question_id?: string;

  @ValidateIf((o: AnswerEntryDto) => o.question_id === undefined)
  @IsString()
  questionId?: string;

  @IsString()
  answer: string;
}

export class SubmitExamDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerEntryDto)
  answers: AnswerEntryDto[];

  @IsInt()
  @Min(0)
  @IsOptional()
  time_spent?: number;

  // camelCase alias used by the web client.
  @IsInt()
  @Min(0)
  @IsOptional()
  timeTaken?: number;
}
