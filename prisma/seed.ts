// Prisma seed — creates roles/permissions, default service hours, sample SLAs,
// catalog items, CI types, and a seed admin user.
import { PrismaClient } from '@prisma/client';
import { ALL_PERMISSIONS, DEFAULT_ROLES } from '../packages/shared/src';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding...');

  // Permissions
  for (const key of ALL_PERMISSIONS) {
    await prisma.permission.upsert({ where: { key }, update: {}, create: { key } });
  }

  // Roles + role permissions
  for (const r of DEFAULT_ROLES) {
    const role = await prisma.role.upsert({
      where: { key: r.key },
      update: { name: r.name },
      create: { key: r.key, name: r.name },
    });
    for (const pk of r.permissions) {
      const perm = await prisma.permission.findUnique({ where: { key: pk } });
      if (!perm) continue;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
        update: {},
        create: { roleId: role.id, permissionId: perm.id },
      });
    }
  }

  // Admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@itsm.local' },
    update: {},
    create: { email: 'admin@itsm.local', displayName: 'ITSM Admin' },
  });
  const adminRole = await prisma.role.findUnique({ where: { key: 'admin' } });
  if (adminRole) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: admin.id, roleId: adminRole.id } },
      update: {},
      create: { userId: admin.id, roleId: adminRole.id },
    });
  }

  // Service hours (24x7 + 9-5 weekdays UTC)
  await prisma.serviceHours.upsert({
    where: { name: '24x7' },
    update: {},
    create: {
      name: '24x7',
      timezone: 'UTC',
      schedule: JSON.stringify([0, 1, 2, 3, 4, 5, 6].map((d) => ({ day: d, start: '00:00', end: '23:59' }))),
    },
  });
  const businessHours = await prisma.serviceHours.upsert({
    where: { name: 'business-hours' },
    update: {},
    create: {
      name: 'business-hours',
      timezone: 'UTC',
      schedule: JSON.stringify([1, 2, 3, 4, 5].map((d) => ({ day: d, start: '09:00', end: '17:00' }))),
    },
  });

  // SLAs by priority for incidents
  const slas = [
    { key: 'incident-P1', name: 'Incident P1', responseMins: 15, resolveMins: 240 },
    { key: 'incident-P2', name: 'Incident P2', responseMins: 30, resolveMins: 480 },
    { key: 'incident-P3', name: 'Incident P3', responseMins: 120, resolveMins: 1440 },
    { key: 'incident-P4', name: 'Incident P4', responseMins: 480, resolveMins: 4320 },
    { key: 'incident-P5', name: 'Incident P5', responseMins: 960, resolveMins: 10080 },
  ];
  for (const s of slas) {
    await prisma.sla.upsert({
      where: { key: s.key },
      update: {},
      create: { ...s, type: 'sla', priority: s.key.split('-')[1], serviceHoursId: businessHours.id },
    });
  }

  // Service catalog seed
  const cat = await prisma.serviceCatalogCategory.upsert({
    where: { key: 'access' },
    update: {},
    create: { key: 'access', name: 'Access' },
  });
  await prisma.catalogItem.upsert({
    where: { key: 'new-laptop' },
    update: {},
    create: {
      key: 'new-laptop',
      name: 'Request a new laptop',
      categoryId: cat.id,
      description: 'Order a new laptop for an employee.',
      formSchema: JSON.stringify({
        fields: [
          { name: 'model', label: 'Model', type: 'select', options: ['Standard', 'Developer', 'Executive'] },
          { name: 'justification', label: 'Justification', type: 'textarea' },
        ],
      }),
      approvalSchema: JSON.stringify([{ approverId: admin.id, dueInHours: 48 }]),
      fulfilmentSchema: JSON.stringify([
        { title: 'Procure laptop', description: 'Order from supplier' },
        { title: 'Image laptop', description: 'Apply standard image' },
        { title: 'Deliver to user', description: 'Hand off and capture sign-off' },
      ]),
      estDeliveryDays: 7,
    },
  });

  // CMDB seed
  const serverType = await prisma.ciType.upsert({
    where: { key: 'server' }, update: {}, create: { key: 'server', name: 'Server' },
  });
  await prisma.ciType.upsert({ where: { key: 'application' }, update: {}, create: { key: 'application', name: 'Application' } });
  await prisma.ciType.upsert({ where: { key: 'database' }, update: {}, create: { key: 'database', name: 'Database' } });
  await prisma.ciType.upsert({ where: { key: 'service' }, update: {}, create: { key: 'service', name: 'Business Service' } });

  await prisma.configurationItem.upsert({
    where: { refNo: 'CI-0000001' },
    update: {},
    create: { refNo: 'CI-0000001', name: 'web-prod-01', ciTypeId: serverType.id, environment: 'prod', status: 'active' },
  });

  // Counter init
  for (const k of ['INC', 'SR', 'PRB', 'CHG', 'REL', 'KB', 'ASSET', 'CI', 'CONTRACT']) {
    await prisma.counter.upsert({ where: { key: k }, update: {}, create: { key: k, value: k === 'CI' ? 1 : 0 } });
  }

  console.log('Seed done.');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => prisma.$disconnect());
