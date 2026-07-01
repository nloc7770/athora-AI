import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateDocumentDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsIn(['pdf', 'doc', 'audio', 'note', 'video'])
  type: string;

  @IsString()
  @IsOptional()
  course_id?: string;

  @IsString()
  @IsOptional()
  session_id?: string;

  @IsString()
  @IsOptional()
  file_url?: string;

  @IsInt()
  @IsOptional()
  file_size?: number;

  @IsInt()
  @IsOptional()
  pages?: number;

  @IsInt()
  @IsOptional()
  duration?: number;
}
