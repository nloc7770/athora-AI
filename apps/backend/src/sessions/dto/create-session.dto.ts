import { IsString, IsOptional } from 'class-validator';

export class CreateSessionDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}
