// Demo seed — populates sample records for every ITIL module so the UI is
// not empty. Idempotent: safe to re-run; uses upsert/findFirst guards.
//
// Run: pnpm prisma:seed:demo

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const log = (...a: any[]) => console.log('[demo-seed]', ...a);

async function nextRef(key: string, prefix: string, pad = 7) {
  const c = await prisma.counter.upsert({
    where: { key },
    update: { value: { increment: 1 } },
    create: { key, value: 1 },
  });
  return `${prefix}-${String(c.value).padStart(pad, '0')}`;
}

async function ensureUser(email: string, displayName: string, jobTitle?: string) {
  return prisma.user.upsert({
    where: { email },
    update: { displayName, jobTitle },
    create: { email, displayName, jobTitle, entraOid: `seed-${email}` },
  });
}

async function ensureGroup(key: string, name: string) {
  return prisma.group.upsert({
    where: { key },
    update: { name },
    create: { key, name },
  });
}

async function addToGroup(userId: string, groupId: string, isLead = false) {
  await prisma.groupMembership.upsert({
    where: { userId_groupId: { userId, groupId } },
    update: { isLead },
    create: { userId, groupId, isLead },
  });
}

async function addRole(userId: string, roleKey: string) {
  const role = await prisma.role.findUnique({ where: { key: roleKey } });
  if (!role) return;
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId, roleId: role.id } },
    update: {},
    create: { userId, roleId: role.id },
  });
}

async function main() {
  log('Starting...');

  // ---------------- Users & Groups ----------------
  const admin = await prisma.user.findUnique({ where: { email: 'admin@itsm.local' } });
  if (!admin) throw new Error('Run base seed first (pnpm prisma:seed)');

  const alice = await ensureUser('alice@itsm.local', 'Alice Anderson', 'Service Desk Lead');
  const bob = await ensureUser('bob@itsm.local', 'Bob Brown', 'Senior Engineer');
  const carol = await ensureUser('carol@itsm.local', 'Carol Chen', 'Change Manager');
  const dave = await ensureUser('dave@itsm.local', 'Dave Davis', 'End User');
  const eve = await ensureUser('eve@itsm.local', 'Eve Edwards', 'Approver');

  await addRole(alice.id, 'agent');
  await addRole(bob.id, 'agent');
  await addRole(carol.id, 'change_manager');
  await addRole(eve.id, 'approver');
  await addRole(dave.id, 'requester');

  const sd = await ensureGroup('service-desk', 'Service Desk');
  const ops = await ensureGroup('platform-ops', 'Platform Operations');
  const cab = await ensureGroup('cab', 'Change Advisory Board');

  await addToGroup(alice.id, sd.id, true);
  await addToGroup(dave.id, sd.id);
  await addToGroup(bob.id, ops.id, true);
  await addToGroup(carol.id, cab.id, true);
  await addToGroup(eve.id, cab.id);

  // ---------------- CMDB ----------------
  const tServer = await prisma.ciType.upsert({ where: { key: 'server' }, update: {}, create: { key: 'server', name: 'Server' } });
  const tApp = await prisma.ciType.upsert({ where: { key: 'application' }, update: {}, create: { key: 'application', name: 'Application' } });
  const tDb = await prisma.ciType.upsert({ where: { key: 'database' }, update: {}, create: { key: 'database', name: 'Database' } });
  const tSvc = await prisma.ciType.upsert({ where: { key: 'service' }, update: {}, create: { key: 'service', name: 'Business Service' } });

  async function ensureCi(refNo: string, name: string, ciTypeId: string, env = 'prod') {
    return prisma.configurationItem.upsert({
      where: { refNo },
      update: { name },
      create: { refNo, name, ciTypeId, environment: env, status: 'active' },
    });
  }
  const ciWeb1 = await ensureCi('CI-0000001', 'web-prod-01', tServer.id);
  const ciWeb2 = await ensureCi('CI-0000002', 'web-prod-02', tServer.id);
  const ciDb1 = await ensureCi('CI-0000003', 'db-prod-01', tDb.id);
  const ciApp = await ensureCi('CI-0000004', 'orders-api', tApp.id);
  const ciSvc = await ensureCi('CI-0000005', 'Order Management', tSvc.id);

  // CI counter to reflect highest used
  await prisma.counter.upsert({ where: { key: 'CI' }, update: { value: 5 }, create: { key: 'CI', value: 5 } });

  async function ensureRel(sourceId: string, targetId: string, type: string) {
    const exists = await prisma.ciRelationship.findFirst({ where: { sourceId, targetId, type } });
    if (!exists) await prisma.ciRelationship.create({ data: { sourceId, targetId, type } });
  }
  await ensureRel(ciSvc.id, ciApp.id, 'depends_on');
  await ensureRel(ciApp.id, ciWeb1.id, 'runs_on');
  await ensureRel(ciApp.id, ciWeb2.id, 'runs_on');
  await ensureRel(ciApp.id, ciDb1.id, 'depends_on');

  // ---------------- Incidents ----------------
  const incCount = await prisma.incident.count();
  if (incCount < 3) {
    const samples = [
      { title: 'Cannot log in to portal', priority: 'P2', urgency: 'high', impact: 'medium', status: 'in_progress', assigneeId: alice.id, supportGroupId: sd.id, requesterId: dave.id, ciId: ciApp.id },
      { title: 'Slow database response', priority: 'P3', urgency: 'medium', impact: 'medium', status: 'assigned', assigneeId: bob.id, supportGroupId: ops.id, requesterId: dave.id, ciId: ciDb1.id },
      { title: 'Email delivery delays', priority: 'P2', urgency: 'high', impact: 'high', status: 'new', requesterId: dave.id, supportGroupId: sd.id },
      { title: 'Printer offline floor 3', priority: 'P4', urgency: 'low', impact: 'low', status: 'resolved', resolution: 'Reset printer power', resolvedAt: new Date(), assigneeId: alice.id, requesterId: dave.id },
    ];
    for (const s of samples) {
      const refNo = await nextRef('INC', 'INC');
      await prisma.incident.create({
        data: {
          refNo,
          title: s.title,
          description: s.title + ' — auto-seeded sample.',
          priority: s.priority,
          urgency: s.urgency,
          impact: s.impact,
          status: s.status,
          source: 'portal',
          requesterId: s.requesterId,
          assigneeId: (s as any).assigneeId,
          supportGroupId: (s as any).supportGroupId,
          resolution: (s as any).resolution,
          resolvedAt: (s as any).resolvedAt,
          affectedCis: (s as any).ciId ? { create: [{ ciId: (s as any).ciId }] } : undefined,
        },
      });
    }
    log('Incidents seeded');
  }

  // ---------------- Service Catalog & Requests ----------------
  const catAccess = await prisma.serviceCatalogCategory.upsert({
    where: { key: 'access' }, update: {}, create: { key: 'access', name: 'Access' },
  });
  const catHw = await prisma.serviceCatalogCategory.upsert({
    where: { key: 'hardware' }, update: {}, create: { key: 'hardware', name: 'Hardware' },
  });
  const catSw = await prisma.serviceCatalogCategory.upsert({
    where: { key: 'software' }, update: {}, create: { key: 'software', name: 'Software' },
  });

  const newLaptop = await prisma.catalogItem.upsert({
    where: { key: 'new-laptop' },
    update: {},
    create: {
      key: 'new-laptop', name: 'Request a new laptop', categoryId: catHw.id,
      description: 'Order a new laptop for an employee.',
      formSchema: JSON.stringify({ fields: [
        { name: 'model', label: 'Model', type: 'select', options: ['Standard', 'Developer', 'Executive'] },
        { name: 'justification', label: 'Justification', type: 'textarea' },
      ] }),
      approvalSchema: JSON.stringify([{ approverId: eve.id, dueInHours: 48 }]),
      fulfilmentSchema: JSON.stringify([
        { title: 'Procure laptop', description: 'Order from supplier' },
        { title: 'Image laptop', description: 'Apply standard image' },
        { title: 'Deliver to user', description: 'Hand off and capture sign-off' },
      ]),
      estDeliveryDays: 7,
    },
  });
  await prisma.catalogItem.upsert({
    where: { key: 'vpn-access' },
    update: {},
    create: {
      key: 'vpn-access', name: 'Request VPN access', categoryId: catAccess.id,
      description: 'Grant access to corporate VPN.',
      formSchema: JSON.stringify({ fields: [
        { name: 'reason', label: 'Reason', type: 'textarea' },
      ] }),
      approvalSchema: JSON.stringify([{ approverId: eve.id, dueInHours: 24 }]),
      fulfilmentSchema: JSON.stringify([{ title: 'Provision VPN account', description: 'Create user in VPN gateway' }]),
      estDeliveryDays: 1,
    },
  });
  await prisma.catalogItem.upsert({
    where: { key: 'office-install' },
    update: {},
    create: {
      key: 'office-install', name: 'Install Office 365', categoryId: catSw.id,
      description: 'Install M365 desktop apps.',
      formSchema: JSON.stringify({ fields: [{ name: 'machine', label: 'Machine name', type: 'text' }] }),
      fulfilmentSchema: JSON.stringify([{ title: 'Push install package', description: 'Use Intune' }]),
      estDeliveryDays: 1,
    },
  });

  const srCount = await prisma.serviceRequest.count();
  if (srCount < 2) {
    const refNo = await nextRef('SR', 'SR');
    const sr = await prisma.serviceRequest.create({
      data: {
        refNo, title: 'New laptop for Dave Davis', status: 'fulfilment',
        catalogItemId: newLaptop.id,
        formData: JSON.stringify({ model: 'Developer', justification: 'Replace failing device' }),
        requesterId: dave.id, assigneeId: bob.id, supportGroupId: ops.id,
        tasks: { create: [
          { sequence: 1, title: 'Procure laptop', status: 'done', completedAt: new Date() },
          { sequence: 2, title: 'Image laptop', status: 'in_progress' },
          { sequence: 3, title: 'Deliver to user', status: 'pending' },
        ] },
      },
    });
    await prisma.approval.create({
      data: {
        entityType: 'service_request', entityId: sr.id,
        stepNumber: 1, approverId: eve.id, status: 'approved',
        decidedAt: new Date(), comment: 'Approved by manager.',
      },
    });
    const refNo2 = await nextRef('SR', 'SR');
    await prisma.serviceRequest.create({
      data: {
        refNo: refNo2, title: 'VPN access for contractor', status: 'approval_pending',
        catalogItemId: (await prisma.catalogItem.findUnique({ where: { key: 'vpn-access' } }))!.id,
        requesterId: dave.id, formData: JSON.stringify({ reason: 'Remote work' }),
      },
    });
    log('Service requests seeded');
  }

  // ---------------- Problems ----------------
  if ((await prisma.problem.count()) < 2) {
    const p1Ref = await nextRef('PRB', 'PRB');
    const p1 = await prisma.problem.create({
      data: {
        refNo: p1Ref, title: 'Recurring DB connection drops', description: 'Connection pool exhausts every Monday morning.',
        status: 'investigation', priority: 'P2', raisedById: bob.id, assigneeId: bob.id, supportGroupId: ops.id,
        affectedCis: { create: [{ ciId: ciDb1.id }] },
      },
    });
    const p2Ref = await nextRef('PRB', 'PRB');
    const p2 = await prisma.problem.create({
      data: {
        refNo: p2Ref, title: 'Slow page load on portal', description: 'Avg TTFB > 2s during peak hours.',
        status: 'known_error', priority: 'P3', raisedById: alice.id, assigneeId: bob.id,
        rootCause: 'Inefficient query on dashboard widget.', workaround: 'Cache widget for 5 minutes.',
        affectedCis: { create: [{ ciId: ciApp.id }] },
      },
    });
    await prisma.knownError.create({
      data: {
        problemId: p2.id,
        symptoms: 'Dashboard takes >2s to load on first visit.',
        cause: 'N+1 query in widget aggregation.',
        workaround: 'Enable widget cache (admin → settings).',
        publishedAt: new Date(),
      },
    });
    log('Problems & known error seeded');
  }

  // ---------------- Changes & Freeze Window ----------------
  if ((await prisma.changeRequest.count()) < 2) {
    const c1Ref = await nextRef('CHG', 'CHG');
    await prisma.changeRequest.create({
      data: {
        refNo: c1Ref, title: 'Upgrade web servers to Node 22',
        description: 'Rolling restart with traffic shift.', changeType: 'normal',
        status: 'cab_review', priority: 'P3', riskScore: 35, riskLevel: 'medium',
        raisedById: bob.id, ownerId: bob.id, supportGroupId: ops.id,
        plannedStart: new Date(Date.now() + 86400_000 * 3),
        plannedEnd: new Date(Date.now() + 86400_000 * 3 + 7200_000),
        implementationPlan: '1. Drain web-prod-01 ... 2. Upgrade ... 3. Validate ... 4. Repeat for web-prod-02.',
        rollbackPlan: 'Revert image, restore from snapshot.',
        affectedCis: { create: [{ ciId: ciWeb1.id }, { ciId: ciWeb2.id }] },
      },
    });
    const c2Ref = await nextRef('CHG', 'CHG');
    await prisma.changeRequest.create({
      data: {
        refNo: c2Ref, title: 'Emergency DB index rebuild',
        description: 'Address slow queries from PRB-0000002.', changeType: 'emergency',
        status: 'approved', priority: 'P2', riskScore: 60, riskLevel: 'high',
        raisedById: bob.id, ownerId: bob.id,
        plannedStart: new Date(Date.now() + 3600_000),
        plannedEnd: new Date(Date.now() + 7200_000),
        affectedCis: { create: [{ ciId: ciDb1.id }] },
      },
    });
    await prisma.freezeWindow.create({
      data: {
        name: 'Year-end financial close',
        startsAt: new Date(new Date().getFullYear(), 11, 20),
        endsAt: new Date(new Date().getFullYear() + 1, 0, 5),
        scope: JSON.stringify({ services: ['finance', 'orders'] }),
        reason: 'Protect finance close window.',
      },
    });
    log('Changes seeded');
  }

  // ---------------- Releases ----------------
  if ((await prisma.release.count()) < 1) {
    const refNo = await nextRef('REL', 'REL');
    await prisma.release.create({
      data: {
        refNo, name: 'Q1 Platform Release', description: 'Quarterly platform refresh.',
        type: 'minor', status: 'build', managerId: carol.id,
        plannedAt: new Date(Date.now() + 86400_000 * 14),
        releasePlan: 'Bundle CHG-0000001 and CHG-0000002.',
        tasks: { create: [
          { sequence: 1, title: 'Build artifacts', status: 'done', completedAt: new Date() },
          { sequence: 2, title: 'UAT sign-off', status: 'in_progress' },
          { sequence: 3, title: 'Production deploy', status: 'pending' },
        ] },
        affectedCis: { create: [{ ciId: ciApp.id }] },
      },
    });
    log('Release seeded');
  }

  // ---------------- Knowledge ----------------
  if ((await prisma.kbArticle.count()) < 2) {
    for (const a of [
      {
        title: 'How to reset your portal password',
        body: '## Reset password\n1. Go to /login\n2. Click "Forgot password"\n3. Check email for reset link.',
        category: 'Self-service', status: 'published',
      },
      {
        title: 'VPN troubleshooting',
        body: '## Common issues\n- **Cannot connect**: verify MFA token\n- **Slow speed**: switch region',
        category: 'Networking', status: 'published',
      },
    ]) {
      const refNo = await nextRef('KB', 'KB');
      await prisma.kbArticle.create({
        data: {
          refNo, title: a.title, body: a.body, category: a.category,
          status: a.status, authorId: alice.id,
          publishedAt: a.status === 'published' ? new Date() : null,
          tags: JSON.stringify(['howto', a.category.toLowerCase()]),
          versions: { create: [{ version: 1, title: a.title, body: a.body, createdById: alice.id }] },
        },
      });
    }
    log('Knowledge articles seeded');
  }

  // ---------------- Events ----------------
  const evSrc = await prisma.eventSource.upsert({
    where: { key: 'azure-monitor' },
    update: {},
    create: { key: 'azure-monitor', name: 'Azure Monitor', type: 'monitoring' },
  });
  await prisma.eventSource.upsert({
    where: { key: 'datadog' }, update: {}, create: { key: 'datadog', name: 'Datadog', type: 'monitoring' },
  });
  if ((await prisma.eventRecord.count()) < 3) {
    const evs = [
      { severity: 'critical', message: 'CPU > 95% for 5m on web-prod-01', ciId: ciWeb1.id, status: 'open' },
      { severity: 'warning', message: 'Memory > 80% on db-prod-01', ciId: ciDb1.id, status: 'acknowledged' },
      { severity: 'minor', message: 'Disk usage 70% on web-prod-02', ciId: ciWeb2.id, status: 'open' },
    ];
    for (const e of evs) {
      await prisma.eventRecord.create({
        data: { sourceId: evSrc.id, severity: e.severity, message: e.message, ciId: e.ciId, status: e.status },
      });
    }
    await prisma.eventRule.upsert({
      where: { id: '00000000-0000-0000-0000-000000000001' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000001',
        sourceId: evSrc.id, name: 'Auto-incident on critical CPU',
        matchExpr: JSON.stringify({ severity: 'critical', messageContains: 'CPU' }),
        action: 'create_incident', priority: 10,
      },
    });
    log('Events seeded');
  }

  // ---------------- Availability ----------------
  await prisma.availabilityPlan.upsert({
    where: { serviceKey: 'orders' },
    update: {},
    create: { serviceKey: 'orders', name: 'Order Management', targetPct: 99.9, windowDays: 30, notes: 'Tier-1 service.' },
  });
  await prisma.availabilityPlan.upsert({
    where: { serviceKey: 'portal' },
    update: {},
    create: { serviceKey: 'portal', name: 'Customer Portal', targetPct: 99.5, windowDays: 30 },
  });
  if ((await prisma.outageRecord.count()) < 1) {
    await prisma.outageRecord.create({
      data: {
        ciId: ciApp.id, serviceKey: 'orders',
        startedAt: new Date(Date.now() - 86400_000 * 2),
        endedAt: new Date(Date.now() - 86400_000 * 2 + 1800_000),
        type: 'unplanned', reason: 'DB connection pool exhausted (see PRB-0000001).',
      },
    });
    log('Availability seeded');
  }

  // ---------------- Capacity ----------------
  const capPlan = await prisma.capacityPlan.upsert({
    where: { serviceKey: 'orders' },
    update: {},
    create: { serviceKey: 'orders', name: 'Order Management Capacity' },
  });
  if ((await prisma.capacityThreshold.count({ where: { planId: capPlan.id } })) < 2) {
    await prisma.capacityThreshold.createMany({
      data: [
        { planId: capPlan.id, metric: 'cpu', warnAt: 70, critAt: 90 },
        { planId: capPlan.id, metric: 'memory', warnAt: 75, critAt: 90 },
      ],
    });
  }
  if ((await prisma.capacityMetric.count()) < 5) {
    const now = Date.now();
    for (let i = 0; i < 6; i++) {
      await prisma.capacityMetric.create({
        data: { ciId: ciWeb1.id, metric: 'cpu', value: 40 + i * 5, unit: '%', capturedAt: new Date(now - i * 3600_000) },
      });
      await prisma.capacityMetric.create({
        data: { ciId: ciDb1.id, metric: 'memory', value: 60 + i * 3, unit: '%', capturedAt: new Date(now - i * 3600_000) },
      });
    }
    log('Capacity seeded');
  }

  // ---------------- Continuity ----------------
  const cont = await prisma.continuityPlan.upsert({
    where: { serviceKey: 'orders' },
    update: {},
    create: {
      serviceKey: 'orders', name: 'Order Management DR Plan',
      rtoMinutes: 60, rpoMinutes: 15, strategy: 'Active-passive across two Azure regions; automated failover via Front Door.',
      lastTestedAt: new Date(Date.now() - 86400_000 * 90),
    },
  });
  if ((await prisma.drTest.count({ where: { planId: cont.id } })) < 1) {
    await prisma.drTest.create({
      data: {
        planId: cont.id, scheduledAt: new Date(Date.now() + 86400_000 * 30),
        notes: 'Quarterly tabletop exercise.',
      },
    });
    await prisma.drTest.create({
      data: {
        planId: cont.id,
        scheduledAt: new Date(Date.now() - 86400_000 * 90),
        executedAt: new Date(Date.now() - 86400_000 * 90),
        result: 'pass', notes: 'Failover executed in 42m; within RTO.',
      },
    });
    log('Continuity seeded');
  }

  // ---------------- Suppliers & Contracts ----------------
  const supDell = await prisma.supplier.upsert({
    where: { key: 'dell' },
    update: {},
    create: { key: 'dell', name: 'Dell Technologies', contactName: 'Sam Sales', contactEmail: 'sam@dell.example' },
  });
  const supMs = await prisma.supplier.upsert({
    where: { key: 'microsoft' },
    update: {},
    create: { key: 'microsoft', name: 'Microsoft', contactName: 'Mary Account', contactEmail: 'mary@microsoft.example' },
  });
  let dellContract = await prisma.contract.findFirst({ where: { supplierId: supDell.id } });
  if (!dellContract) {
    const cnRef = await nextRef('CONTRACT', 'CT');
    dellContract = await prisma.contract.create({
      data: {
        supplierId: supDell.id, refNo: cnRef, name: 'Hardware MSA',
        startsAt: new Date(new Date().getFullYear(), 0, 1),
        endsAt: new Date(new Date().getFullYear() + 1, 11, 31),
        valueCents: 5_000_000, currency: 'USD', status: 'active',
        obligations: { create: [
          { description: 'Delivery within 5 business days', dueAt: new Date(Date.now() + 86400_000 * 30), status: 'open' },
          { description: '24x7 hardware support', status: 'open' },
        ] },
        reviews: { create: [
          { reviewedAt: new Date(Date.now() - 86400_000 * 30), score: 4, notes: 'Good responsiveness; delivery slightly delayed.' },
        ] },
      },
    });
  }
  let msContract = await prisma.contract.findFirst({ where: { supplierId: supMs.id } });
  if (!msContract) {
    const cnRef = await nextRef('CONTRACT', 'CT');
    msContract = await prisma.contract.create({
      data: {
        supplierId: supMs.id, refNo: cnRef, name: 'M365 EA',
        startsAt: new Date(new Date().getFullYear(), 0, 1),
        endsAt: new Date(new Date().getFullYear() + 2, 11, 31),
        valueCents: 12_000_000, currency: 'USD', status: 'active',
      },
    });
  }
  log('Suppliers & contracts seeded');

  // ---------------- Assets & Licenses ----------------
  if ((await prisma.asset.count()) < 3) {
    const assetSamples = [
      { name: 'Latitude 7440 — Dave', type: 'hardware', model: 'Latitude 7440', vendor: 'Dell', status: 'in_use', ownerId: dave.id, costCents: 180_000, ciId: ciWeb1.id },
      { name: 'Latitude 7440 — Bob', type: 'hardware', model: 'Latitude 7440', vendor: 'Dell', status: 'in_use', ownerId: bob.id, costCents: 180_000, ciId: ciWeb2.id },
      { name: 'Spare laptop pool #3', type: 'hardware', model: 'Latitude 5440', vendor: 'Dell', status: 'in_stock', costCents: 120_000, ciId: ciDb1.id },
    ];
    for (const a of assetSamples) {
      const refNo = await nextRef('ASSET', 'AST');
      // ciId is @unique on Asset; skip if it's already linked
      const ciTaken = await prisma.asset.findFirst({ where: { ciId: a.ciId } });
      await prisma.asset.create({
        data: {
          refNo, name: a.name, type: a.type, model: a.model, vendor: a.vendor, status: a.status,
          ownerId: (a as any).ownerId, costCents: a.costCents, contractId: dellContract!.id,
          ciId: ciTaken ? undefined : a.ciId,
          serialNumber: refNo.replace('AST', 'SN'),
          purchaseDate: new Date(Date.now() - 86400_000 * 90),
          warrantyEnd: new Date(Date.now() + 86400_000 * 365 * 2),
          lifecycleEvents: { create: [{ type: a.status === 'in_use' ? 'assigned' : 'received', notes: 'Initial state' }] },
        },
      });
    }
    await prisma.softwareLicense.create({
      data: { product: 'Microsoft 365 E5', vendor: 'Microsoft', seats: 100, seatsUsed: 73, expiresAt: new Date(Date.now() + 86400_000 * 365) },
    });
    await prisma.softwareLicense.create({
      data: { product: 'Adobe Creative Cloud', vendor: 'Adobe', seats: 25, seatsUsed: 21, expiresAt: new Date(Date.now() + 86400_000 * 180) },
    });
    log('Assets & licenses seeded');
  }

  // ---------------- Financial ----------------
  const cc1 = await prisma.costCenter.upsert({ where: { key: 'IT-OPS' }, update: {}, create: { key: 'IT-OPS', name: 'IT Operations' } });
  const cc2 = await prisma.costCenter.upsert({ where: { key: 'IT-SD' }, update: {}, create: { key: 'IT-SD', name: 'Service Desk' } });
  await prisma.costModel.upsert({
    where: { key: 'per-incident' },
    update: {},
    create: { key: 'per-incident', name: 'Per-incident handling', formula: JSON.stringify({ rateCents: 5000, per: 'incident' }) },
  });
  await prisma.costModel.upsert({
    where: { key: 'per-ci-monthly' },
    update: {},
    create: { key: 'per-ci-monthly', name: 'Per-CI monthly fee', formula: JSON.stringify({ rateCents: 2500, per: 'ci', period: 'month' }) },
  });
  const fy = new Date().getFullYear();
  await prisma.budget.upsert({
    where: { costCenterId_fiscalYear: { costCenterId: cc1.id, fiscalYear: fy } },
    update: {}, create: { costCenterId: cc1.id, fiscalYear: fy, amountCents: 50_000_000 },
  });
  await prisma.budget.upsert({
    where: { costCenterId_fiscalYear: { costCenterId: cc2.id, fiscalYear: fy } },
    update: {}, create: { costCenterId: cc2.id, fiscalYear: fy, amountCents: 20_000_000 },
  });
  if ((await prisma.charge.count()) < 3) {
    await prisma.charge.create({ data: { costCenterId: cc1.id, description: 'Azure compute Q1', amountCents: 8_500_000 } });
    await prisma.charge.create({ data: { costCenterId: cc1.id, description: 'Azure storage Q1', amountCents: 2_300_000 } });
    await prisma.charge.create({ data: { costCenterId: cc2.id, description: 'Service Desk staffing Jan', amountCents: 4_100_000 } });
    log('Financial seeded');
  }

  // ---------------- Notification Templates ----------------
  for (const t of [
    { key: 'incident.created', subject: 'New incident: {{refNo}}', body: 'Incident {{refNo}} ({{priority}}) was created: {{title}}' },
    { key: 'incident.assigned', subject: 'Assigned: {{refNo}}', body: 'You were assigned incident {{refNo}}.' },
    { key: 'change.approved', subject: 'Change approved: {{refNo}}', body: 'Change {{refNo}} has been approved.' },
    { key: 'sla.breach', subject: 'SLA breach: {{refNo}}', body: 'SLA timer on {{entityType}} {{refNo}} breached.' },
  ]) {
    await prisma.notificationTemplate.upsert({
      where: { key: t.key }, update: {}, create: { ...t, channel: 'email' },
    });
  }

  log('Done.');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => prisma.$disconnect());
