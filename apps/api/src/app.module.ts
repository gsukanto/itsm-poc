import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { PermissionsGuard } from './auth/permissions.guard';
import { AuditInterceptor } from './common/audit.interceptor';
import { HttpExceptionFilter } from './common/http-exception.filter';
import { CounterModule } from './common/counter.module';
import { AttachmentsModule } from './attachments/attachments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ApprovalsModule } from './approvals/approvals.module';
import { SlaModule } from './sla/sla.module';
import { UsersModule } from './users/users.module';
import { GroupsModule } from './groups/groups.module';
import { RolesModule } from './roles/roles.module';
import { IncidentsModule } from './modules/incidents/incidents.module';
import { ServiceRequestsModule } from './modules/service-requests/service-requests.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { ProblemsModule } from './modules/problems/problems.module';
import { ChangesModule } from './modules/changes/changes.module';
import { CmdbModule } from './modules/cmdb/cmdb.module';
import { KnowledgeModule } from './modules/knowledge/knowledge.module';
import { EventsModule } from './modules/events/events.module';
import { AvailabilityModule } from './modules/availability/availability.module';
import { CapacityModule } from './modules/capacity/capacity.module';
import { ReleasesModule } from './modules/releases/releases.module';
import { AssetsModule } from './modules/assets/assets.module';
import { ContinuityModule } from './modules/continuity/continuity.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { FinancialModule } from './modules/financial/financial.module';
import { DashboardsModule } from './modules/dashboards/dashboards.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 300 }]),
    PrismaModule,
    AuthModule,
    CounterModule,
    UsersModule,
    GroupsModule,
    RolesModule,
    AttachmentsModule,
    NotificationsModule,
    ApprovalsModule,
    SlaModule,
    IncidentsModule,
    ServiceRequestsModule,
    CatalogModule,
    ProblemsModule,
    ChangesModule,
    CmdbModule,
    KnowledgeModule,
    EventsModule,
    AvailabilityModule,
    CapacityModule,
    ReleasesModule,
    AssetsModule,
    ContinuityModule,
    SuppliersModule,
    FinancialModule,
    DashboardsModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
  ],
})
export class AppModule {}
