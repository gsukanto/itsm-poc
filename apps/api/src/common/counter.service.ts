import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CounterService {
  constructor(private prisma: PrismaService) {}

  async next(key: string, pad = 7): Promise<string> {
    const value = await this.prisma.$transaction(async (tx) => {
      await tx.counter.upsert({
        where: { key },
        update: { value: { increment: 1 } },
        create: { key, value: 1 },
      });
      const c = await tx.counter.findUnique({ where: { key } });
      return c!.value;
    });
    return `${key}-${String(value).padStart(pad, '0')}`;
  }
}
