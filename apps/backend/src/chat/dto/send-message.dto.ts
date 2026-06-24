import { IsString, IsOptional, MinLength } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @MinLength(1)
  readonly content: string;

  @IsString()
  @IsOptional()
  readonly courseContext?: string;
}
