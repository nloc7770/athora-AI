import { IsIn, IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateFlashcardDto {
  @IsString()
  @IsOptional()
  front?: string;

  @IsString()
  @IsOptional()
  back?: string;

  @IsString()
  @IsIn(['easy', 'medium', 'hard'])
  @IsOptional()
  difficulty?: string;

  @IsInt()
  @IsOptional()
  streak?: number;

  @IsString()
  @IsOptional()
  last_reviewed?: string;

  @IsString()
  @IsOptional()
  next_review?: string;
}
