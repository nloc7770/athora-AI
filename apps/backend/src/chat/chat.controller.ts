import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Sse,
  ParseUUIDPipe,
  MessageEvent,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ChatService } from './chat.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { SendMessageDto } from './dto/send-message.dto';

@Controller('chat')
@UseGuards(SupabaseAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('sessions')
  async createSession(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateSessionDto,
  ) {
    return this.chatService.createSession(userId, dto);
  }

  @Get('sessions')
  async getSessions(
    @CurrentUser('id') userId: string,
    @Query('documentId') documentId?: string,
  ) {
    return this.chatService.getSessions(userId, documentId);
  }

  @Get('sessions/:id/messages')
  async getHistory(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) sessionId: string,
  ) {
    return this.chatService.getHistory(userId, sessionId);
  }

  @Post('sessions/:id/messages')
  async sendMessage(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) sessionId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(userId, sessionId, dto.content);
  }

  @Sse('sessions/:id/messages/stream')
  @Post('sessions/:id/messages/stream')
  streamMessage(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) sessionId: string,
    @Body() dto: SendMessageDto,
  ): Observable<MessageEvent> {
    return new Observable<MessageEvent>((subscriber) => {
      const run = async () => {
        try {
          const generator = this.chatService.sendMessageStream(
            userId,
            sessionId,
            dto.content,
          );

          for await (const chunk of generator) {
            subscriber.next({ data: JSON.stringify({ content: chunk }) });
          }

          subscriber.next({ data: JSON.stringify({ done: true }) });
          subscriber.complete();
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Stream failed';
          subscriber.next({
            data: JSON.stringify({ error: message }),
          });
          subscriber.complete();
        }
      };

      run();
    });
  }
}
