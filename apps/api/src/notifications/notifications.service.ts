import { Injectable, Logger } from '@nestjs/common';
import { ServiceBusClient } from '@azure/service-bus';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../prisma/prisma.service';

export interface NotifyInput {
  recipientId: string;
  channel?: 'email' | 'inapp' | 'webhook';
  subject: string;
  body: string;
  entityType?: string;
  entityId?: string;
}

@Injectable()
export class NotificationsService {
  private readonly log = new Logger(NotificationsService.name);
  private sb?: ServiceBusClient;
  private queueName = process.env.SERVICE_BUS_NOTIFICATIONS_QUEUE ?? 'notifications';
  private mailer = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? 'localhost',
    port: Number(process.env.SMTP_PORT ?? 1025),
    secure: false,
  });

  constructor(private prisma: PrismaService) {
    const conn = process.env.SERVICE_BUS_CONNECTION_STRING;
    if (conn) this.sb = new ServiceBusClient(conn);
  }

  async enqueue(input: NotifyInput) {
    const channel = input.channel ?? 'email';
    const n = await this.prisma.notification.create({
      data: {
        recipientId: input.recipientId,
        channel,
        subject: input.subject,
        body: input.body,
        entityType: input.entityType,
        entityId: input.entityId,
      },
    });
    if (this.sb) {
      const sender = this.sb.createSender(this.queueName);
      try {
        await sender.sendMessages({ body: { id: n.id } });
      } finally {
        await sender.close();
      }
    } else {
      // local fallback: deliver immediately
      void this.deliver(n.id);
    }
    return n;
  }

  async deliver(notificationId: string) {
    const n = await this.prisma.notification.findUnique({
      where: { id: notificationId },
      include: { recipient: true },
    });
    if (!n) return;
    try {
      if (n.channel === 'email') {
        await this.mailer.sendMail({
          from: process.env.MAIL_FROM ?? 'itsm@localhost',
          to: n.recipient.email,
          subject: n.subject,
          text: n.body,
        });
      }
      await this.prisma.notification.update({ where: { id: n.id }, data: { status: 'sent', sentAt: new Date() } });
    } catch (e: any) {
      this.log.warn(`notify failed: ${e.message}`);
      await this.prisma.notification.update({ where: { id: n.id }, data: { status: 'failed' } });
    }
  }

  listForUser(userId: string) {
    return this.prisma.notification.findMany({
      where: { recipientId: userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  markRead(id: string) {
    return this.prisma.notification.update({ where: { id }, data: { status: 'read', readAt: new Date() } });
  }
}
