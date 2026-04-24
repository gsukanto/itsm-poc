import { Module } from '@nestjs/common';
import { ContinuityController } from './continuity.controller';
@Module({ controllers: [ContinuityController] })
export class ContinuityModule {}
