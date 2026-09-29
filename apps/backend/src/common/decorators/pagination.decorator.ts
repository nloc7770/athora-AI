import {
  BadRequestException,
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import { plainToInstance, Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min, validateSync } from 'class-validator';

export class ListPaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}

/**
 * Validate just `limit`/`offset` from the query string. A param decorator
 * rather than `@Query() dto` because the global ValidationPipe runs with
 * forbidNonWhitelisted — a whole-query DTO would 400 every existing filter
 * (courseId, sessionId, ...) that isn't declared on it.
 */
export function parsePagination(
  query: Record<string, unknown> = {},
): ListPaginationDto {
  const dto = plainToInstance(ListPaginationDto, {
    limit: query.limit,
    offset: query.offset,
  });
  const errors = validateSync(dto);
  if (errors.length) {
    throw new BadRequestException(
      errors.flatMap((e) => Object.values(e.constraints ?? {})),
    );
  }
  return dto;
}

export const Pagination = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) =>
    parsePagination(ctx.switchToHttp().getRequest().query),
);

/**
 * Apply `.range()` only when a limit was sent — no limit means the full list,
 * exactly as before pagination existed. `offset` alone is ignored.
 */
export function applyPagination<
  Q extends { range(from: number, to: number): Q },
>(query: Q, page?: ListPaginationDto): Q {
  if (!page?.limit) return query;
  const from = page.offset ?? 0;
  return query.range(from, from + page.limit - 1);
}
