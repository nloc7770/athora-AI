import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, catchError, concatMap } from 'rxjs';
import { CacheService } from './cache.service';

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Any authenticated HTTP write drops that user's cached read models. One DEL
 * per mutation is far cheaper than wiring invalidation into every service
 * (documents, sessions, exams, flashcards, ...) and cannot miss a new route.
 * Background writes (document processing, generation jobs) invalidate at
 * their own call sites.
 */
@Injectable()
export class CacheInvalidateInterceptor implements NestInterceptor {
  constructor(private readonly cache: CacheService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();
    const req = context.switchToHttp().getRequest();
    if (!WRITE_METHODS.has(req.method)) return next.handle();

    // Awaited before the response goes out, so a client that refetches right
    // after its write never reads the pre-write cache. Runs on errors too: a
    // write that fails halfway may still have changed data. invalidateUser
    // never throws and fails fast when Redis is down.
    const invalidate = async () => {
      const userId: string | undefined = req.user?.id;
      if (userId) await this.cache.invalidateUser(userId);
    };
    return next.handle().pipe(
      concatMap(async (body) => {
        await invalidate();
        return body;
      }),
      catchError(async (err) => {
        await invalidate();
        throw err;
      }),
    );
  }
}
