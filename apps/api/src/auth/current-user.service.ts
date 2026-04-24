import { Injectable, Scope, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';
import type { AuthUser } from './jwt.strategy';

@Injectable({ scope: Scope.REQUEST })
export class CurrentUserService {
  constructor(@Inject(REQUEST) private readonly req: Request) {}
  get user(): AuthUser | undefined {
    return (this.req as any).user;
  }
  get id(): string | undefined {
    return this.user?.id;
  }
}
