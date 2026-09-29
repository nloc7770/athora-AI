import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import FormData from 'form-data';

/** User-readable failure — lands in the document's failed state, never a raw axios dump. */
export class SttError extends Error {}

@Injectable()
export class SttService {
  private readonly logger = new Logger(SttService.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly model: string;
  private readonly path: string;
  private readonly timeoutMs: number;
  private readonly maxBytes: number;

  constructor(private readonly config: ConfigService) {
    this.baseUrl = this.config.get<string>('STT_BASE_URL', '').replace(/\/+$/, '');
    this.apiKey = this.config.get<string>('STT_API_KEY', '');
    this.model = this.config.get<string>('STT_MODEL', 'whisper-1');
    // OpenAI-compatible servers use /audio/transcriptions; the CDS whisper box
    // (faster-whisper, POST /transcribe) does not. Configurable so either works.
    this.path = this.config
      .get<string>('STT_PATH', '/audio/transcriptions')
      .replace(/^(?!\/)/, '/');
    // Lectures are slow on a LAN box — 5 min default.
    this.timeoutMs = this.config.get<number>('STT_TIMEOUT_MS', 300_000);
    this.maxBytes = this.config.get<number>('STT_MAX_BYTES', 25 * 1024 * 1024);
  }

  /** Empty STT_BASE_URL = feature off: fail fast instead of hanging. */
  isEnabled(): boolean {
    return this.baseUrl.length > 0;
  }

  /** OpenAI-compatible multipart call. STT_BASE_URL must include /v1. */
  async transcribe(buffer: Buffer, filename: string, mimetype: string): Promise<{ text: string }> {
    if (!this.isEnabled()) {
      throw new SttError('Audio transcription is not configured');
    }
    if (buffer.length > this.maxBytes) {
      throw new SttError('Audio file exceeds the 25 MB transcription limit');
    }

    const form = new FormData();
    form.append('file', buffer, { filename, contentType: mimetype });
    form.append('model', this.model);

    try {
      const res = await axios.post(`${this.baseUrl}${this.path}`, form, {
        headers: {
          ...form.getHeaders(),
          ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
        },
        timeout: this.timeoutMs,
        maxBodyLength: Infinity,
      });

      const text = res.data?.text;
      if (typeof text !== 'string' || text.trim().length === 0) {
        throw new SttError('Transcription returned empty text');
      }
      return { text };
    } catch (error: unknown) {
      if (error instanceof SttError) throw error;
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          throw new SttError('Audio transcription timed out');
        }
        this.logger.warn(`STT failed: HTTP ${error.response?.status ?? 'no response'}`);
        throw new SttError(`Transcription failed (HTTP ${error.response?.status ?? 'unreachable'})`);
      }
      throw new SttError('Transcription failed unexpectedly');
    }
  }
}
