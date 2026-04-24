import { Module } from '@nestjs/common';
import { CapacityController } from './capacity.controller';
@Module({ controllers: [CapacityController] })
export class CapacityModule {}
