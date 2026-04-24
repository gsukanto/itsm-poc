// ITSM background worker — consumes Service Bus queues for notifications,
// SLA breach checks (also runs in API), and event ingestion fan-out.
import { ServiceBusClient } from '@azure/service-bus';
import { PrismaClient } from '@prisma/client';
import * as nodemailer from 'nodemailer';
import * as appInsights from 'applicationinsights';

const conn = process.env.SERVICE_BUS_CONNECTION_STRING;
const notifyQueue = process.env.SERVICE_BUS_NOTIFICATIONS_QUEUE ?? 'notifications';
const aiConn = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING;
if (aiConn) appInsights.setup(aiConn).start();

const prisma = new PrismaClient();
const mailer = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? 'localhost',
  port: Number(process.env.SMTP_PORT ?? 1025),
  secure: false,
});

async function deliver(notificationId: string) {
  const n = await prisma.notification.findUnique({ where: { id: notificationId }, include: { recipient: true } });
  if (!n) return;
  try {
    if (n.channel === 'email') {
      await mailer.sendMail({
        from: process.env.MAIL_FROM ?? 'itsm@localhost',
        to: n.recipient.email,
        subject: n.subject,
        text: n.body,
      });
    }
    await prisma.notification.update({ where: { id: n.id }, data: { status: 'sent', sentAt: new Date() } });
    console.log(`[worker] sent notification ${n.id} to ${n.recipient.email}`);
  } catch (e: any) {
    console.warn(`[worker] notify failed: ${e.message}`);
    await prisma.notification.update({ where: { id: n.id }, data: { status: 'failed' } });
  }
}

async function checkSla() {
  const due = await prisma.slaTimer.findMany({
    where: { metAt: null, breached: false, dueAt: { lte: new Date() } },
  });
  if (due.length) {
    await prisma.slaTimer.updateMany({
      where: { id: { in: due.map((t) => t.id) } },
      data: { breached: true, breachedAt: new Date() },
    });
    console.warn(`[worker] SLA breaches: ${due.length}`);
  }
}

async function main() {
  console.log('[worker] starting');

  // SLA tick every minute (in addition to API ticker)
  setInterval(() => { checkSla().catch((e) => console.error(e)); }, 60_000);

  if (!conn) {
    console.log('[worker] SERVICE_BUS_CONNECTION_STRING not set — polling DB for queued notifications');
    setInterval(async () => {
      const queued = await prisma.notification.findMany({ where: { status: 'queued' }, take: 50 });
      for (const n of queued) await deliver(n.id);
    }, 5000);
    return;
  }

  const sb = new ServiceBusClient(conn);
  const receiver = sb.createReceiver(notifyQueue);
  receiver.subscribe({
    processMessage: async (msg) => {
      const body = msg.body as { id: string };
      if (body?.id) await deliver(body.id);
    },
    processError: async (err) => console.error('[worker] sb error', err),
  });
  console.log(`[worker] subscribed to queue ${notifyQueue}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
