import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import type { ChatMessage, ChatOptions } from './dto/chat.dto';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;
const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);
const MAX_CONCURRENT_CALLS = 5; // Max simultaneous LLM requests

function isRetryableError(error: unknown): boolean {
  if (error instanceof OpenAI.APIError) {
    return RETRYABLE_STATUS_CODES.has(error.status);
  }
  if (error instanceof Error && error.message.includes('ECONNRESET')) {
    return true;
  }
  return false;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class Semaphore {
  private queue: Array<() => void> = [];
  private running = 0;

  constructor(private readonly max: number) {}

  async acquire(): Promise<void> {
    if (this.running < this.max) {
      this.running++;
      return;
    }
    return new Promise<void>((resolve) => {
      this.queue.push(resolve);
    });
  }

  release(): void {
    this.running--;
    const next = this.queue.shift();
    if (next) {
      this.running++;
      next();
    }
  }
}

@Injectable()
export class LlmService {
  private readonly clients: OpenAI[];
  private readonly primaryModel: string;
  private readonly fallbackModels: string[];
  private readonly logger = new Logger(LlmService.name);
  private readonly semaphore = new Semaphore(MAX_CONCURRENT_CALLS);
  private clientIndex = 0;

  constructor(private readonly config: ConfigService) {
    const baseURL = this.config.getOrThrow<string>('AI_BASE_URL');
    this.primaryModel = this.config.get<string>('AI_MODEL') ?? 'deepseek-v4-pro';

    // Support multiple API keys (comma-separated) for rotation
    const keysRaw = this.config.get<string>('AI_API_KEYS')
      ?? this.config.get<string>('AI_API_KEY')
      ?? '';
    const keys = keysRaw.split(',').map((k) => k.trim()).filter(Boolean);

    if (keys.length === 0) {
      throw new Error('No AI API keys configured (AI_API_KEYS or AI_API_KEY)');
    }

    this.clients = keys.map((apiKey) => new OpenAI({ baseURL, apiKey, timeout: 120_000 }));

    // Fallback models (comma-separated)
    const fallbackRaw = this.config.get<string>('AI_FALLBACK_MODELS') ?? '';
    this.fallbackModels = fallbackRaw.split(',').map((m) => m.trim()).filter(Boolean);

    this.logger.log(
      `LLM initialized: ${keys.length} key(s), primary=${this.primaryModel}, fallbacks=[${this.fallbackModels.join(', ')}]`,
    );
  }

  private getClient(): OpenAI {
    const client = this.clients[this.clientIndex % this.clients.length];
    this.clientIndex++;
    return client;
  }

  private async withRetry<T>(fn: (client: OpenAI, model: string) => Promise<T>, context: string): Promise<T> {
    let lastError: unknown;

    // Try primary model with all keys
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const client = this.getClient();
      try {
        return await fn(client, this.primaryModel);
      } catch (error: unknown) {
        lastError = error;

        if (!isRetryableError(error) || attempt === MAX_RETRIES) {
          break;
        }

        const delayMs = RETRY_DELAY_MS * Math.pow(2, attempt);
        const status = error instanceof OpenAI.APIError ? error.status : 'unknown';
        this.logger.warn(
          `${context} failed (${status}) with ${this.primaryModel}, retrying in ${delayMs}ms (attempt ${attempt + 1}/${MAX_RETRIES})`,
        );
        await delay(delayMs);
      }
    }

    // Try fallback models
    for (const fallbackModel of this.fallbackModels) {
      const client = this.getClient();
      try {
        this.logger.warn(`${context} falling back to model: ${fallbackModel}`);
        return await fn(client, fallbackModel);
      } catch (error: unknown) {
        lastError = error;
        const status = error instanceof OpenAI.APIError ? error.status : 'unknown';
        this.logger.warn(`${context} fallback ${fallbackModel} also failed (${status})`);
      }
    }

    throw lastError;
  }

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<string> {
    await this.semaphore.acquire();
    try {
      return await this.withRetry(async (client, model) => {
        const response = await client.chat.completions.create({
          model,
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
      }, 'LlmService.chat');
    } finally {
      this.semaphore.release();
    }
  }

  async *chatStream(
    messages: ChatMessage[],
    options?: Omit<ChatOptions, 'stream'>,
  ): AsyncGenerator<string> {
    await this.semaphore.acquire();
    try {
      const client = this.getClient();
      const stream = await client.chat.completions.create({
        model: this.primaryModel,
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
    } finally {
      this.semaphore.release();
    }
  }

  async generateJson<T>(messages: ChatMessage[], schema: object): Promise<T> {
    await this.semaphore.acquire();
    try {
      return await this.withRetry(async (client, model) => {
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

      this.logger.log(`Calling LLM (${model}) with ${mappedMessages.length} messages`);

      const response = await client.chat.completions.create({
        model,
        messages: mappedMessages,
        temperature: 0,
        stream: false,
      });

      const choice = response.choices?.[0];
      const content = choice?.message?.content ?? null;

      if (!content) {
        this.logger.error(`LLM empty content. finish=${choice?.finish_reason}`);
        throw new Error('LLM returned empty response for JSON generation');
      }

      // Strip markdown code fences if present
      const cleaned = content.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();

      try {
        return JSON.parse(cleaned) as T;
      } catch {
        this.logger.error('Failed to parse LLM JSON response', { content: cleaned.slice(0, 500) });
        throw new Error('LLM returned invalid JSON');
      }
    }, 'LlmService.generateJson');
    } finally {
      this.semaphore.release();
    }
  }
}
