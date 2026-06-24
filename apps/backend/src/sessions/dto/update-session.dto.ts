import { IsString, IsOptional } from 'class-validator';

export class UpdateSessionDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
