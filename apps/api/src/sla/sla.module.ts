import { Global, Module } from '@nestjs/common';
import { SlaService } from './sla.service';
import { SlaController } from './sla.controller';
import { SlaTickerService } from './sla.ticker';

@Global()
@Module({
  providers: [SlaService, SlaTickerService],
  controllers: [SlaController],
  exports: [SlaService],
})
export class SlaModule {}
