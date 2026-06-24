import { IsArray, IsEnum, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export type ChatMessageRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  readonly role: ChatMessageRole;
  readonly content: string;
}

export interface ChatOptions {
  readonly temperature?: number;
  readonly maxTokens?: number;
  readonly stream?: boolean;
}

class ChatMessageDto {
  @IsEnum(['system', 'user', 'assistant'])
  readonly role: ChatMessageRole;

  @IsString()
  readonly content: string;
}

export class ChatRequestDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  readonly messages: ChatMessageDto[];

  @IsOptional()
  @IsNumber()
  readonly temperature?: number;

  @IsOptional()
  @IsNumber()
  readonly maxTokens?: number;

  @IsOptional()
  readonly stream?: boolean;
}

export class ChatResponseDto {
  readonly content: string;
  readonly model: string;
  readonly usage: {
    readonly promptTokens: number;
    readonly completionTokens: number;
    readonly totalTokens: number;
  };
}

export class JsonGenerateRequestDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  readonly messages: ChatMessageDto[];

  readonly schema: object;
}
