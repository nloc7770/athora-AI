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

    let content: string | null = null;

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: allMessages.map((m) => ({ role: m.role, content: m.content })),
        temperature: 0,
        response_format: { type: 'json_object' },
        stream: false,
      });

      content = response.choices?.[0]?.message?.content ?? null;
    } catch {
      // Fallback: some models don't support response_format
      this.logger.warn('response_format not supported, retrying without it');
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: allMessages.map((m) => ({ role: m.role, content: m.content })),
        temperature: 0,
        stream: false,
      });

      content = response.choices?.[0]?.message?.content ?? null;
    }

    if (!content) {
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
