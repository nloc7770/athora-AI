import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  Res,
  Header,
} from '@nestjs/common';
import * as express from 'express';
import { Throttle } from '@nestjs/throttler';
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
    @Query('sessionId') sessionId?: string,
  ) {
    return this.chatService.getSessions(userId, documentId, sessionId);
  }

  @Get('sessions/:id/messages')
  async getHistory(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) sessionId: string,
  ) {
    return this.chatService.getHistory(userId, sessionId);
  }

  @Post('sessions/:id/messages')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async sendMessage(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) sessionId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(userId, sessionId, dto.content, dto.courseContext);
  }

  @Post('sessions/:id/messages/stream')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async streamMessage(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) sessionId: string,
    @Body() dto: SendMessageDto,
    @Res({ passthrough: false }) res: express.Response,
  ): Promise<void> {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    try {
      const generator = this.chatService.sendMessageStream(
        userId,
        sessionId,
        dto.content,
      );

      for await (const chunk of generator) {
        res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
      }

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Stream failed';
      res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
    } finally {
      res.end();
    }
  }
}
