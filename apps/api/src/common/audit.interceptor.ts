import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';

const WRITE_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = ctx.switchToHttp().getRequest();
    if (!WRITE_METHODS.has(req.method)) return next.handle();
    const actorId = req.user?.id ?? null;
    const path: string = req.route?.path ?? req.url;
    const segments = path.split('/').filter(Boolean);
    const entityType = segments[2] ?? 'unknown';
    const entityId = req.params?.id ?? '';
    const action = req.method.toLowerCase();

    return next.handle().pipe(
      tap(async (result) => {
        try {
          await this.prisma.auditEvent.create({
            data: {
              entityType,
              entityId: String(entityId || (result as any)?.id || ''),
              action,
              actorId: actorId ?? undefined,
              after: result ? JSON.stringify(result).slice(0, 8000) : undefined,
              metadata: JSON.stringify({ method: req.method, path }),
            },
          });
        } catch {
          /* swallow audit errors */
        }
      }),
    );
  }
}
