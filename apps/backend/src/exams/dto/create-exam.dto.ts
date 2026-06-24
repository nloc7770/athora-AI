import {
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateExamQuestionDto {
  @IsString()
  @IsNotEmpty()
  question: string;

  @IsString()
  @IsIn(['multiple_choice', 'short_answer', 'true_false'])
  type: string;

  @IsOptional()
  options?: unknown;

  @IsString()
  @IsNotEmpty()
  correct_answer: string;

  @IsString()
  @IsOptional()
  explanation?: string;

  @IsInt()
  order_index: number;
}

export class CreateExamDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  course_id?: string;

  @IsInt()
  question_count: number;

  @IsString()
  @IsOptional()
  difficulty?: string;

  @IsInt()
  @IsOptional()
  time_limit?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateExamQuestionDto)
  questions: CreateExamQuestionDto[];
}
