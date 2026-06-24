import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateFlashcardDto {
  @IsString()
  @IsNotEmpty()
  front: string;

  @IsString()
  @IsNotEmpty()
  back: string;

  @IsString()
  @IsIn(['easy', 'medium', 'hard'])
  @IsOptional()
  difficulty?: string;
}
