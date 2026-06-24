import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import type { ChatMessage, ChatOptions } from './dto/chat.dto';

@Injectable()
export class LlmService {
  private readonly client: OpenAI;
  private readonly model: string;
  private readonly logger = new Logger(LlmService.name);

  constructor(private readonly config: ConfigService) {
    const baseURL = this.config.getOrThrow<string>('AI_BASE_URL');
    const apiKey = this.config.getOrThrow<string>('AI_API_KEY');
    this.model = this.config.get<string>('AI_MODEL') ?? 'DeepSeek-V4-Pro';

    this.client = new OpenAI({ baseURL, apiKey });
  }

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: options?.temperature,
      max_tokens: options?.maxTokens,
      stream: false,
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      this.logger.warn('LLM returned empty response');
      return '';
    }

    return content;
  }

  async *chatStream(
    messages: ChatMessage[],
    options?: Omit<ChatOptions, 'stream'>,
  ): AsyncGenerator<string> {
    const stream = await this.client.chat.completions.create({
      model: this.model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: options?.temperature,
      max_tokens: options?.maxTokens,
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        yield delta;
      }
    }
  }

  async generateJson<T>(messages: ChatMessage[], schema: object): Promise<T> {
    const systemMessage: ChatMessage = {
      role: 'system',
      content: [
        'You must respond with valid JSON only. No markdown, no code fences, no explanation.',
        'The response must conform to this JSON schema:',
        JSON.stringify(schema),
      ].join('\n'),
    };

    const allMessages: ChatMessage[] = [systemMessage, ...messages];
    const mappedMessages = allMessages.map((m) => ({ role: m.role, content: m.content }));

    this.logger.log(`Calling LLM with ${mappedMessages.length} messages, model: ${this.model}`);

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: mappedMessages,
      temperature: 0,
      stream: false,
    });

    this.logger.log(`LLM response: choices=${response.choices?.length}, id=${response.id}`);

    const choice = response.choices?.[0];
    const content = choice?.message?.content ?? null;

    this.logger.log(`LLM content: length=${content?.length ?? 0}, role=${choice?.message?.role}, finish=${choice?.finish_reason}`);

    if (!content) {
      this.logger.error(`LLM empty content. message=${JSON.stringify(choice?.message).slice(0, 300)}`);
      throw new Error('LLM returned empty response for JSON generation');
    }

    // Strip markdown code fences if present
    const cleaned = content.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();

    try {
      return JSON.parse(cleaned) as T;
    } catch (error) {
      this.logger.error('Failed to parse LLM JSON response', { content: cleaned.slice(0, 500) });
      throw new Error('LLM returned invalid JSON');
    }
  }
}
