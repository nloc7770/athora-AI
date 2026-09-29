import { BadRequestException } from '@nestjs/common';
import { applyPagination, parsePagination } from './pagination.decorator';
import { ExamsService } from '../../exams/exams.service';

function makeQuery() {
  const calls: Array<[number, number]> = [];
  const q = {
    range(from: number, to: number) {
      calls.push([from, to]);
      return q;
    },
  };
  return { q, calls };
}

describe('parsePagination', () => {
  it('returns empty pagination when nothing is sent', () => {
    expect(parsePagination({})).toMatchObject({
      limit: undefined,
      offset: undefined,
    });
    expect(parsePagination(undefined)).toMatchObject({
      limit: undefined,
      offset: undefined,
    });
  });

  it('coerces query strings to integers', () => {
    expect(parsePagination({ limit: '20', offset: '40' })).toMatchObject({
      limit: 20,
      offset: 40,
    });
  });

  it('ignores unrelated filters instead of rejecting them', () => {
    expect(parsePagination({ courseId: 'c-1', limit: '5' })).toMatchObject({
      limit: 5,
    });
  });

  it.each([
    [{ limit: '0' }],
    [{ limit: '101' }],
    [{ limit: '2.5' }],
    [{ limit: 'abc' }],
    [{ offset: '-1' }],
  ])('rejects %j', (query) => {
    expect(() => parsePagination(query)).toThrow(BadRequestException);
  });
});

describe('applyPagination', () => {
  it('leaves the query untouched without a limit', () => {
    const { q, calls } = makeQuery();
    expect(applyPagination(q, undefined)).toBe(q);
    applyPagination(q, { offset: 10 });
    expect(calls).toEqual([]);
  });

  it('maps limit/offset to an inclusive range', () => {
    const { q, calls } = makeQuery();
    applyPagination(q, { limit: 10 });
    applyPagination(q, { limit: 10, offset: 30 });
    expect(calls).toEqual([
      [0, 9],
      [30, 39],
    ]);
  });
});

describe('list service pagination (ExamsService.findAll)', () => {
  function makeSupabase(rows: unknown[]) {
    const ranges: Array<[number, number]> = [];
    const builder: Record<string, unknown> = {};
    for (const m of ['select', 'eq', 'order']) builder[m] = () => builder;
    builder['range'] = (from: number, to: number) => {
      ranges.push([from, to]);
      return builder;
    };
    builder['then'] = (resolve: (v: unknown) => void) =>
      resolve({ data: rows, error: null });
    const service = { getAdminClient: () => ({ from: () => builder }) };
    return { service: service as never, ranges };
  }

  it('returns every row unchanged when no pagination is sent', async () => {
    const rows = [{ id: 'e-1' }, { id: 'e-2' }];
    const { service, ranges } = makeSupabase(rows);
    await expect(new ExamsService(service).findAll('u-1')).resolves.toBe(rows);
    expect(ranges).toEqual([]);
  });

  it('applies range when limit is sent', async () => {
    const { service, ranges } = makeSupabase([]);
    await new ExamsService(service).findAll('u-1', { limit: 5, offset: 10 });
    expect(ranges).toEqual([[10, 14]]);
  });
});
