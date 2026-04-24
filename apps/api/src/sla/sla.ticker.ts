import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SlaService } from './sla.service';

@Injectable()
export class SlaTickerService {
  private readonly log = new Logger(SlaTickerService.name);
  constructor(private sla: SlaService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async tick() {
    await this.sla.checkBreaches();
  }
}
