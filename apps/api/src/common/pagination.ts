import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class PageQuery {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 25, minimum: 1, maximum: 200 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(200)
  pageSize = 25;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  q?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString()
  sort?: string;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function paginate<T>(items: T[], total: number, q: PageQuery): Page<T> {
  return {
    items,
    total,
    page: q.page,
    pageSize: q.pageSize,
    totalPages: Math.max(1, Math.ceil(total / q.pageSize)),
  };
}

export function parseSort(sort: string | undefined, allowed: string[]): Record<string, 'asc' | 'desc'>[] {
  if (!sort) return [{ createdAt: 'desc' }];
  return sort
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const dir: 'asc' | 'desc' = s.startsWith('-') ? 'desc' : 'asc';
      const field = s.replace(/^[-+]/, '');
      if (!allowed.includes(field)) return null;
      return { [field]: dir } as Record<string, 'asc' | 'desc'>;
    })
    .filter(Boolean) as Record<string, 'asc' | 'desc'>[];
}
