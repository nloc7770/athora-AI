import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateFlashcardSetDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  course_id?: string;

  @IsString()
  @IsOptional()
  document_id?: string;
}
