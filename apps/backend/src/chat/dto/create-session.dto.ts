import { IsEnum, IsOptional, IsString } from 'class-validator';

export type ChatSessionType = 'document_chat' | 'tutor';

export class CreateSessionDto {
  @IsOptional()
  @IsString()
  readonly documentId?: string;

  @IsEnum(['document_chat', 'tutor'])
  readonly type: ChatSessionType;
}
