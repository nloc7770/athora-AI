import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import type { Redis } from 'ioredis';

export const CACHE_REDIS = Symbol('CACHE_REDIS');

/**
 * Per-user cached read models. Every key listed here is dropped by
 * invalidateUser — add new cached reads here or they will serve stale data
 * until their TTL runs out.
 */
export const CACHE_KEYS = {
  brainGraph: (userId: string) => `athora:cache:${userId}:brain:graph`,
  analyticsSummary: (userId: string) =>
    `athora:cache:${userId}:analytics:summary`,
};

const WARN_INTERVAL_MS = 60_000;

/**
 * Tiny read-through cache over Redis. Fails open: when Redis is down every
 * call degrades to "compute it" and a throttled warning, never an error.
 */
@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private lastWarnAt = 0;

  constructor(@Inject(CACHE_REDIS) private readonly redis: Redis) {
    // Without a listener ioredis prints every reconnect failure as unhandled.
    this.redis.on('error', (err) => this.warn('connection', err));
  }

  async wrap<T>(
    key: string,
    ttlSeconds: number,
    compute: () => Promise<T>,
  ): Promise<T> {
    try {
      const hit = await this.redis.get(key);
      if (hit !== null) return JSON.parse(hit) as T;
    } catch (err) {
      this.warn('read', err);
    }

    const value = await compute();
    // Write is off the response path; a failed write just means a later miss.
    this.redis
      .set(key, JSON.stringify(value), 'EX', ttlSeconds)
      .catch((err: unknown) => this.warn('write', err));
    return value;
  }

  /** Drop every cached read model for a user. Never throws. */
  async invalidateUser(userId: string): Promise<void> {
    try {
      await this.redis.del(...Object.values(CACHE_KEYS).map((k) => k(userId)));
    } catch (err) {
      this.warn('invalidate', err);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit().catch(() => this.redis.disconnect());
  }

  private warn(op: string, err: unknown): void {
    const now = Date.now();
    if (now - this.lastWarnAt < WARN_INTERVAL_MS) return;
    this.lastWarnAt = now;
    const message = err instanceof Error ? err.message : String(err);
    this.logger.warn(`Redis cache ${op} failed, serving uncached: ${message}`);
  }
}
