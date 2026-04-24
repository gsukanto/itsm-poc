// Bulk seed — generates ~100 sample records per ITIL module for load/UX testing.
// Idempotent: skips modules that already have >= TARGET rows.
//
// Run: pnpm prisma:seed:bulk

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const TARGET = 100;
const log = (...a: any[]) => console.log('[bulk-seed]', ...a);

const pick = <T>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const daysFromNow = (d: number) => new Date(Date.now() + d * 86400_000);

async function nextRef(key: string, prefix: string, pad = 7) {
  const c = await prisma.counter.upsert({
    where: { key }, update: { value: { increment: 1 } }, create: { key, value: 1 },
  });
  return `${prefix}-${String(c.value).padStart(pad, '0')}`;
}

async function ensureUser(email: string, displayName: string) {
  return prisma.user.upsert({
    where: { email }, update: {},
    create: { email, displayName, entraOid: `bulk-${email}` },
  });
}

async function main() {
  log('Starting bulk seed...');

  // Pool of users
  const userPool = [
    await prisma.user.findUnique({ where: { email: 'admin@itsm.local' } }),
    await prisma.user.findUnique({ where: { email: 'alice@itsm.local' } }) ?? await ensureUser('alice@itsm.local', 'Alice Anderson'),
    await prisma.user.findUnique({ where: { email: 'bob@itsm.local' } }) ?? await ensureUser('bob@itsm.local', 'Bob Brown'),
    await prisma.user.findUnique({ where: { email: 'carol@itsm.local' } }) ?? await ensureUser('carol@itsm.local', 'Carol Chen'),
    await prisma.user.findUnique({ where: { email: 'dave@itsm.local' } }) ?? await ensureUser('dave@itsm.local', 'Dave Davis'),
    await prisma.user.findUnique({ where: { email: 'eve@itsm.local' } }) ?? await ensureUser('eve@itsm.local', 'Eve Edwards'),
  ].filter(Boolean) as any[];
  if (userPool.length === 0) throw new Error('Run base seed first (pnpm prisma:seed)');

  // ---------------- CMDB CIs (need first; many modules reference) ----------------
  const tServer = await prisma.ciType.upsert({ where: { key: 'server' }, update: {}, create: { key: 'server', name: 'Server' } });
  const tApp = await prisma.ciType.upsert({ where: { key: 'application' }, update: {}, create: { key: 'application', name: 'Application' } });
  const tDb = await prisma.ciType.upsert({ where: { key: 'database' }, update: {}, create: { key: 'database', name: 'Database' } });
  const tSvc = await prisma.ciType.upsert({ where: { key: 'service' }, update: {}, create: { key: 'service', name: 'Business Service' } });
  const ciTypes = [tServer, tApp, tDb, tSvc];
  const envs = ['prod', 'staging', 'dev', 'qa'];
  const namePrefix = ['web', 'api', 'db', 'cache', 'worker', 'queue', 'auth', 'payment', 'orders', 'reports'];

  let ciCount = await prisma.configurationItem.count();
  if (ciCount < TARGET) {
    log(`CMDB: have ${ciCount}, creating ${TARGET - ciCount}...`);
    for (let i = ciCount; i < TARGET; i++) {
      const refNo = await nextRef('CI', 'CI');
      await prisma.configurationItem.create({
        data: {
          refNo,
          name: `${pick(namePrefix)}-${pick(envs)}-${String(i).padStart(2, '0')}`,
          ciTypeId: pick(ciTypes).id,
          environment: pick(envs),
          status: pick(['active', 'active', 'active', 'maintenance', 'retired']),
        },
      });
    }
  }
  const allCis = await prisma.configurationItem.findMany({ select: { id: true } });

  // ---------------- Catalog items ----------------
  const catCount = await prisma.catalogItem.count();
  if (catCount < TARGET) {
    log(`Catalog: have ${catCount}, creating ${TARGET - catCount}...`);
    const cats = [
      await prisma.serviceCatalogCategory.upsert({ where: { key: 'access' }, update: {}, create: { key: 'access', name: 'Access' } }),
      await prisma.serviceCatalogCategory.upsert({ where: { key: 'hardware' }, update: {}, create: { key: 'hardware', name: 'Hardware' } }),
      await prisma.serviceCatalogCategory.upsert({ where: { key: 'software' }, update: {}, create: { key: 'software', name: 'Software' } }),
    ];
    for (let i = catCount; i < TARGET; i++) {
      await prisma.catalogItem.create({
        data: {
          key: `bulk-item-${i}`,
          name: `Catalog item #${i}`,
          categoryId: pick(cats).id,
          description: `Auto-generated bulk catalog item ${i}.`,
          formSchema: JSON.stringify({ fields: [{ name: 'note', label: 'Note', type: 'textarea' }] }),
          fulfilmentSchema: JSON.stringify([{ title: 'Provision', description: 'Auto-fulfil' }]),
          estDeliveryDays: randInt(1, 14),
          isActive: Math.random() > 0.1,
        },
      });
    }
  }

  // ---------------- Incidents ----------------
  const incCount = await prisma.incident.count();
  if (incCount < TARGET) {
    log(`Incidents: have ${incCount}, creating ${TARGET - incCount}...`);
    const titles = ['Cannot login', 'Slow response', 'Email delay', 'Printer offline', 'VPN drop', 'Disk full', 'Service unavailable', 'High CPU', 'DB timeout', 'Page error'];
    const statuses = ['new', 'assigned', 'in_progress', 'pending', 'resolved', 'closed'];
    const prios = ['P1', 'P2', 'P3', 'P3', 'P3', 'P4', 'P5'];
    for (let i = incCount; i < TARGET; i++) {
      const refNo = await nextRef('INC', 'INC');
      const status = pick(statuses);
      const priority = pick(prios);
      await prisma.incident.create({
        data: {
          refNo,
          title: `${pick(titles)} (#${i})`,
          description: `Auto-generated incident ${i}. Symptoms vary.`,
          priority, urgency: pick(['low', 'medium', 'high']), impact: pick(['low', 'medium', 'high']),
          status, source: pick(['portal', 'email', 'phone', 'event']),
          requesterId: pick(userPool).id,
          assigneeId: Math.random() > 0.3 ? pick(userPool).id : undefined,
          resolution: status === 'resolved' || status === 'closed' ? 'Auto-resolved during bulk seed.' : undefined,
          resolvedAt: status === 'resolved' || status === 'closed' ? daysFromNow(-randInt(1, 30)) : undefined,
          closedAt: status === 'closed' ? daysFromNow(-randInt(0, 5)) : undefined,
          createdAt: daysFromNow(-randInt(0, 60)),
        },
      });
    }
  }

  // ---------------- Service Requests ----------------
  const srCount = await prisma.serviceRequest.count();
  if (srCount < TARGET) {
    log(`Service Requests: have ${srCount}, creating ${TARGET - srCount}...`);
    const items = await prisma.catalogItem.findMany({ take: 20, select: { id: true } });
    const statuses = ['new', 'approval_pending', 'approved', 'fulfilment', 'resolved', 'closed'];
    for (let i = srCount; i < TARGET; i++) {
      const refNo = await nextRef('SR', 'SR');
      await prisma.serviceRequest.create({
        data: {
          refNo,
          title: `Bulk request #${i}`,
          status: pick(statuses),
          priority: pick(['P2', 'P3', 'P3', 'P4']),
          catalogItemId: items.length > 0 ? pick(items).id : undefined,
          formData: JSON.stringify({ note: `Sample form data ${i}` }),
          requesterId: pick(userPool).id,
          assigneeId: Math.random() > 0.5 ? pick(userPool).id : undefined,
          createdAt: daysFromNow(-randInt(0, 60)),
        },
      });
    }
  }

  // ---------------- Problems ----------------
  const prbCount = await prisma.problem.count();
  if (prbCount < TARGET) {
    log(`Problems: have ${prbCount}, creating ${TARGET - prbCount}...`);
    const statuses = ['new', 'investigation', 'known_error', 'resolved', 'closed'];
    for (let i = prbCount; i < TARGET; i++) {
      const refNo = await nextRef('PRB', 'PRB');
      await prisma.problem.create({
        data: {
          refNo,
          title: `Recurring issue #${i}`,
          description: `Pattern observed across multiple incidents (${i}).`,
          status: pick(statuses),
          priority: pick(['P2', 'P3', 'P3', 'P4']),
          raisedById: pick(userPool).id,
          assigneeId: Math.random() > 0.4 ? pick(userPool).id : undefined,
          rootCause: Math.random() > 0.5 ? 'Resource exhaustion under peak load.' : undefined,
          workaround: Math.random() > 0.5 ? 'Restart service every 24h.' : undefined,
          createdAt: daysFromNow(-randInt(0, 90)),
        },
      });
    }
  }

  // ---------------- Changes ----------------
  const chgCount = await prisma.changeRequest.count();
  if (chgCount < TARGET) {
    log(`Changes: have ${chgCount}, creating ${TARGET - chgCount}...`);
    const types = ['standard', 'normal', 'normal', 'emergency'];
    const statuses = ['draft', 'assess', 'cab_review', 'approved', 'scheduled', 'implementation', 'review', 'closed'];
    for (let i = chgCount; i < TARGET; i++) {
      const refNo = await nextRef('CHG', 'CHG');
      const start = daysFromNow(randInt(-30, 30));
      await prisma.changeRequest.create({
        data: {
          refNo,
          title: `Change #${i} — ${pick(['upgrade', 'patch', 'config', 'migration'])}`,
          description: `Bulk-seeded change ${i}.`,
          changeType: pick(types),
          status: pick(statuses),
          priority: pick(['P2', 'P3', 'P3', 'P4']),
          riskScore: randInt(5, 90),
          riskLevel: pick(['low', 'medium', 'high']),
          raisedById: pick(userPool).id,
          ownerId: pick(userPool).id,
          plannedStart: start,
          plannedEnd: new Date(start.getTime() + randInt(1, 4) * 3600_000),
          createdAt: daysFromNow(-randInt(0, 60)),
        },
      });
    }
  }

  // ---------------- Releases ----------------
  const relCount = await prisma.release.count();
  if (relCount < TARGET) {
    log(`Releases: have ${relCount}, creating ${TARGET - relCount}...`);
    const types = ['major', 'minor', 'minor', 'patch', 'emergency'];
    const statuses = ['planning', 'build', 'uat', 'deploy', 'review', 'closed'];
    for (let i = relCount; i < TARGET; i++) {
      const refNo = await nextRef('REL', 'REL');
      await prisma.release.create({
        data: {
          refNo,
          name: `Release ${pick(['v1', 'v2', 'v3'])}.${i}`,
          description: `Bulk release ${i}.`,
          type: pick(types),
          status: pick(statuses),
          managerId: pick(userPool).id,
          plannedAt: daysFromNow(randInt(-30, 60)),
        },
      });
    }
  }

  // ---------------- Knowledge ----------------
  const kbCount = await prisma.kbArticle.count();
  if (kbCount < TARGET) {
    log(`Knowledge: have ${kbCount}, creating ${TARGET - kbCount}...`);
    const cats = ['Self-service', 'Networking', 'Software', 'Hardware', 'Security', 'Account'];
    for (let i = kbCount; i < TARGET; i++) {
      const refNo = await nextRef('KB', 'KB');
      const status = pick(['draft', 'review', 'published', 'published', 'published']);
      await prisma.kbArticle.create({
        data: {
          refNo,
          title: `KB Article #${i} — ${pick(cats)}`,
          body: `## Article ${i}\n\nThis is auto-generated content.\n\n- Bullet point 1\n- Bullet point 2\n\n\`\`\`\nSample code block\n\`\`\``,
          status,
          authorId: pick(userPool).id,
          category: pick(cats),
          tags: JSON.stringify(['auto', pick(cats).toLowerCase()]),
          publishedAt: status === 'published' ? daysFromNow(-randInt(0, 90)) : null,
          views: randInt(0, 500),
        },
      });
    }
  }

  // ---------------- Events ----------------
  const evtCount = await prisma.eventRecord.count();
  if (evtCount < TARGET) {
    log(`Events: have ${evtCount}, creating ${TARGET - evtCount}...`);
    const src = await prisma.eventSource.upsert({
      where: { key: 'azure-monitor' }, update: {},
      create: { key: 'azure-monitor', name: 'Azure Monitor', type: 'monitoring' },
    });
    const messages = ['CPU > 90%', 'Memory > 85%', 'Disk > 80%', 'Latency > 500ms', 'Error rate > 5%', 'Pod restart', 'Connection refused'];
    for (let i = evtCount; i < TARGET; i++) {
      await prisma.eventRecord.create({
        data: {
          sourceId: src.id,
          severity: pick(['info', 'warning', 'minor', 'major', 'critical']),
          status: pick(['open', 'open', 'acknowledged', 'closed']),
          message: `${pick(messages)} on host-${i}`,
          ciId: pick(allCis).id,
          occurredAt: daysFromNow(-randInt(0, 30)),
        },
      });
    }
  }

  // ---------------- Availability plans ----------------
  const avCount = await prisma.availabilityPlan.count();
  if (avCount < TARGET) {
    log(`Availability plans: have ${avCount}, creating ${TARGET - avCount}...`);
    for (let i = avCount; i < TARGET; i++) {
      await prisma.availabilityPlan.create({
        data: {
          serviceKey: `svc-av-${i}`,
          name: `Service Availability Plan #${i}`,
          targetPct: pick([99.0, 99.5, 99.9, 99.95, 99.99]),
          windowDays: pick([7, 30, 90]),
        },
      });
    }
  }

  // ---------------- Capacity plans ----------------
  const capCount = await prisma.capacityPlan.count();
  if (capCount < TARGET) {
    log(`Capacity plans: have ${capCount}, creating ${TARGET - capCount}...`);
    for (let i = capCount; i < TARGET; i++) {
      await prisma.capacityPlan.create({
        data: {
          serviceKey: `svc-cap-${i}`,
          name: `Capacity plan #${i}`,
          notes: `Auto-generated capacity plan ${i}.`,
          thresholds: { create: [
            { metric: 'cpu', warnAt: 70, critAt: 90 },
            { metric: 'memory', warnAt: 75, critAt: 90 },
          ] },
        },
      });
    }
  }

  // ---------------- Continuity plans ----------------
  const contCount = await prisma.continuityPlan.count();
  if (contCount < TARGET) {
    log(`Continuity plans: have ${contCount}, creating ${TARGET - contCount}...`);
    for (let i = contCount; i < TARGET; i++) {
      await prisma.continuityPlan.create({
        data: {
          serviceKey: `svc-cont-${i}`,
          name: `Continuity plan #${i}`,
          rtoMinutes: pick([30, 60, 120, 240, 480]),
          rpoMinutes: pick([5, 15, 30, 60]),
          strategy: `Strategy ${i}: active-passive failover.`,
        },
      });
    }
  }

  // ---------------- Suppliers ----------------
  const supCount = await prisma.supplier.count();
  if (supCount < TARGET) {
    log(`Suppliers: have ${supCount}, creating ${TARGET - supCount}...`);
    const names = ['Acme', 'Globex', 'Initech', 'Umbrella', 'Stark', 'Wayne', 'Wonka', 'Hooli', 'Pied Piper', 'Massive Dynamic'];
    for (let i = supCount; i < TARGET; i++) {
      await prisma.supplier.create({
        data: {
          key: `supplier-${i}`,
          name: `${pick(names)} ${i}`,
          contactName: `Contact ${i}`,
          contactEmail: `contact${i}@supplier.example`,
          isActive: Math.random() > 0.1,
        },
      });
    }
  }

  // ---------------- Assets ----------------
  const astCount = await prisma.asset.count();
  if (astCount < TARGET) {
    log(`Assets: have ${astCount}, creating ${TARGET - astCount}...`);
    const types = ['hardware', 'software', 'license', 'virtual', 'mobile', 'network'];
    const vendors = ['Dell', 'HP', 'Apple', 'Lenovo', 'Cisco', 'Microsoft'];
    const usedCiIds = new Set((await prisma.asset.findMany({ where: { ciId: { not: null } }, select: { ciId: true } })).map((a) => a.ciId));
    for (let i = astCount; i < TARGET; i++) {
      const refNo = await nextRef('ASSET', 'AST');
      // ciId is @unique; pick an unused CI or leave null (only one null allowed in SQL Server, so prefer a unique CI)
      let chosenCi: string | undefined;
      for (const c of allCis) {
        if (!usedCiIds.has(c.id)) { chosenCi = c.id; usedCiIds.add(c.id); break; }
      }
      await prisma.asset.create({
        data: {
          refNo,
          name: `Asset ${i} — ${pick(vendors)}`,
          type: pick(types),
          status: pick(['in_stock', 'in_use', 'in_use', 'maintenance', 'retired']),
          serialNumber: `SN-${String(i).padStart(6, '0')}`,
          model: `Model-${randInt(1000, 9999)}`,
          vendor: pick(vendors),
          ownerId: Math.random() > 0.3 ? pick(userPool).id : undefined,
          ciId: chosenCi,
          costCents: randInt(10_000, 500_000),
          purchaseDate: daysFromNow(-randInt(30, 1000)),
          warrantyEnd: daysFromNow(randInt(30, 1000)),
        },
      });
    }
  }

  // ---------------- Cost centers ----------------
  const ccCount = await prisma.costCenter.count();
  if (ccCount < TARGET) {
    log(`Cost centers: have ${ccCount}, creating ${TARGET - ccCount}...`);
    for (let i = ccCount; i < TARGET; i++) {
      await prisma.costCenter.create({
        data: { key: `CC-${String(i).padStart(4, '0')}`, name: `Cost Center ${i}` },
      });
    }
  }

  // ---------------- Charges (financial) ----------------
  const chargeCount = await prisma.charge.count();
  if (chargeCount < TARGET) {
    log(`Charges: have ${chargeCount}, creating ${TARGET - chargeCount}...`);
    const cc = await prisma.costCenter.findMany({ take: 50, select: { id: true } });
    for (let i = chargeCount; i < TARGET; i++) {
      await prisma.charge.create({
        data: {
          costCenterId: pick(cc).id,
          description: `Bulk charge #${i}`,
          amountCents: randInt(10_000, 1_000_000),
          occurredAt: daysFromNow(-randInt(0, 365)),
        },
      });
    }
  }

  log('Bulk seed done.');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => prisma.$disconnect());
