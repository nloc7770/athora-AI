import { CacheService, CACHE_KEYS } from './cache.service';

function makeRedis() {
  const store = new Map<string, string>();
  return {
    store,
    on: jest.fn(),
    get: jest.fn(async (k: string) => store.get(k) ?? null),
    set: jest.fn(async (k: string, v: string) => {
      store.set(k, v);
      return 'OK';
    }),
    del: jest.fn(
      async (...keys: string[]) => keys.filter((k) => store.delete(k)).length,
    ),
    quit: jest.fn(async () => 'OK'),
    disconnect: jest.fn(),
  };
}

const flush = () => new Promise((r) => setImmediate(r));

describe('CacheService', () => {
  it('computes and stores on miss, then serves the hit without recomputing', async () => {
    const redis = makeRedis();
    const cache = new CacheService(redis as never);
    const compute = jest.fn().mockResolvedValue({ n: 1 });

    expect(await cache.wrap('k', 60, compute)).toEqual({ n: 1 });
    await flush();
    expect(redis.set).toHaveBeenCalledWith('k', '{"n":1}', 'EX', 60);

    expect(await cache.wrap('k', 60, compute)).toEqual({ n: 1 });
    expect(compute).toHaveBeenCalledTimes(1);
  });

  it('fails open when Redis read and write reject', async () => {
    const redis = makeRedis();
    redis.get.mockRejectedValue(new Error("Stream isn't writeable"));
    redis.set.mockRejectedValue(new Error("Stream isn't writeable"));
    const cache = new CacheService(redis as never);

    expect(await cache.wrap('k', 60, async () => 42)).toBe(42);
    await flush();
  });

  it('propagates compute errors instead of caching them', async () => {
    const redis = makeRedis();
    const cache = new CacheService(redis as never);

    await expect(
      cache.wrap('k', 60, async () => {
        throw new Error('db down');
      }),
    ).rejects.toThrow('db down');
    expect(redis.set).not.toHaveBeenCalled();
  });

  it('invalidateUser drops every per-user key and never throws', async () => {
    const redis = makeRedis();
    const cache = new CacheService(redis as never);
    redis.store.set(CACHE_KEYS.brainGraph('u1'), '{}');
    redis.store.set(CACHE_KEYS.analyticsSummary('u1'), '{}');
    redis.store.set(CACHE_KEYS.brainGraph('u2'), '{}');

    await cache.invalidateUser('u1');
    expect([...redis.store.keys()]).toEqual([CACHE_KEYS.brainGraph('u2')]);

    redis.del.mockRejectedValue(new Error('down'));
    await expect(cache.invalidateUser('u1')).resolves.toBeUndefined();
  });
});
