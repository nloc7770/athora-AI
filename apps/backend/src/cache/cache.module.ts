import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { Redis } from 'ioredis';
import { CACHE_REDIS, CacheService } from './cache.service';
import { CacheInvalidateInterceptor } from './cache-invalidate.interceptor';

@Global()
@Module({
  providers: [
    {
      provide: CACHE_REDIS,
      inject: [ConfigService],
      // Same REDIS_* config as BullMQ, but its own connection: BullMQ needs
      // maxRetriesPerRequest=null (block forever), a cache must fail fast.
      useFactory: (config: ConfigService) =>
        new Redis({
          host: config.get<string>('REDIS_HOST', 'localhost'),
          port: Number(config.get('REDIS_PORT', 6379)),
          enableOfflineQueue: false,
          maxRetriesPerRequest: 1,
          // A connected-but-stalled Redis would otherwise hang every cached
          // read (and every write, via the invalidation interceptor).
          commandTimeout: 500,
        }),
    },
    CacheService,
    { provide: APP_INTERCEPTOR, useClass: CacheInvalidateInterceptor },
  ],
  exports: [CacheService],
})
export class CacheModule {}
