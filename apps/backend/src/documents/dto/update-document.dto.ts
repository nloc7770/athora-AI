import { IsIn, IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateDocumentDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  course_id?: string;

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

  @IsString()
  @IsIn(['ready', 'processing', 'error'])
  @IsOptional()
  status?: string;
}
