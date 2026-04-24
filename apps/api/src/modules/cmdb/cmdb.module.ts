import { Module } from '@nestjs/common';
import { CmdbController } from './cmdb.controller';
@Module({ controllers: [CmdbController] })
export class CmdbModule {}
