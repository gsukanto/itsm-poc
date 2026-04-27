import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ensureLogin, isUsingMsal } from './auth';
import { Shell } from './components/Shell';
import { Dashboard } from './pages/Dashboard';
import { IncidentList } from './pages/incidents/IncidentList';
import { IncidentDetail } from './pages/incidents/IncidentDetail';
import { IncidentNew } from './pages/incidents/IncidentNew';
import { ServiceRequestList } from './pages/service-requests/ServiceRequestList';
import { ServiceRequestDetail } from './pages/service-requests/ServiceRequestDetail';
import { CatalogBrowse } from './pages/catalog/CatalogBrowse';
import { CatalogRequest } from './pages/catalog/CatalogRequest';
import { ProblemList } from './pages/problems/ProblemList';
import { ProblemDetail } from './pages/problems/ProblemDetail';
import { ChangeList } from './pages/changes/ChangeList';
import { ChangeDetail } from './pages/changes/ChangeDetail';
import { ChangeNew } from './pages/changes/ChangeNew';
import { ChangeCalendar } from './pages/changes/ChangeCalendar';
import { CmdbList } from './pages/cmdb/CmdbList';
import { CmdbDetail } from './pages/cmdb/CmdbDetail';
import { KnowledgeList } from './pages/knowledge/KnowledgeList';
import { KnowledgeDetail } from './pages/knowledge/KnowledgeDetail';
import { SlaList } from './pages/slm/SlaList';
import { EventList } from './pages/events/EventList';
import { AvailabilityList } from './pages/availability/AvailabilityList';
import { CapacityList } from './pages/capacity/CapacityList';
import { ReleaseList } from './pages/releases/ReleaseList';
import { ReleaseDetail } from './pages/releases/ReleaseDetail';
import { AssetList } from './pages/assets/AssetList';
import { AssetDetail } from './pages/assets/AssetDetail';
import { ContinuityList } from './pages/continuity/ContinuityList';
import { ContinuityDetail } from './pages/continuity/ContinuityDetail';
import { SupplierList } from './pages/suppliers/SupplierList';
import { SupplierDetail } from './pages/suppliers/SupplierDetail';
import { FinancialPage } from './pages/financial/FinancialPage';
import { Approvals } from './pages/Approvals';
import { WorkflowList } from './pages/admin/WorkflowList';
import { WorkflowEdit } from './pages/admin/WorkflowEdit';
import { LoginPage } from './pages/LoginPage';
import { EventDetail } from './pages/events/EventDetail';
import { SlaDetail } from './pages/slm/SlaDetail';
import { AvailabilityDetail } from './pages/availability/AvailabilityDetail';
import { CapacityDetail } from './pages/capacity/CapacityDetail';

export function App() {
  useEffect(() => { if (isUsingMsal) ensureLogin(); }, []);
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<Shell />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/incidents" element={<IncidentList />} />
        <Route path="/incidents/new" element={<IncidentNew />} />
        <Route path="/incidents/:id" element={<IncidentDetail />} />
        <Route path="/service-requests" element={<ServiceRequestList />} />
        <Route path="/service-requests/:id" element={<ServiceRequestDetail />} />
        <Route path="/catalog" element={<CatalogBrowse />} />
        <Route path="/catalog/:id" element={<CatalogRequest />} />
        <Route path="/problems" element={<ProblemList />} />
        <Route path="/problems/:id" element={<ProblemDetail />} />
        <Route path="/changes" element={<ChangeList />} />
        <Route path="/changes/new" element={<ChangeNew />} />
        <Route path="/changes/calendar" element={<ChangeCalendar />} />
        <Route path="/changes/:id" element={<ChangeDetail />} />
        <Route path="/cmdb" element={<CmdbList />} />
        <Route path="/cmdb/:id" element={<CmdbDetail />} />
        <Route path="/knowledge" element={<KnowledgeList />} />
        <Route path="/knowledge/:id" element={<KnowledgeDetail />} />
        <Route path="/slm" element={<SlaList />} />
        <Route path="/slm/:id" element={<SlaDetail />} />
        <Route path="/events" element={<EventList />} />
        <Route path="/events/:id" element={<EventDetail />} />
        <Route path="/availability" element={<AvailabilityList />} />
        <Route path="/availability/:id" element={<AvailabilityDetail />} />
        <Route path="/capacity" element={<CapacityList />} />
        <Route path="/capacity/:id" element={<CapacityDetail />} />
        <Route path="/releases" element={<ReleaseList />} />
        <Route path="/releases/:id" element={<ReleaseDetail />} />
        <Route path="/assets" element={<AssetList />} />
        <Route path="/assets/:id" element={<AssetDetail />} />
        <Route path="/continuity" element={<ContinuityList />} />
        <Route path="/continuity/:id" element={<ContinuityDetail />} />
        <Route path="/suppliers" element={<SupplierList />} />
        <Route path="/suppliers/:id" element={<SupplierDetail />} />
        <Route path="/financial" element={<FinancialPage />} />
        <Route path="/approvals" element={<Approvals />} />
        <Route path="/admin/workflows" element={<WorkflowList />} />
        <Route path="/admin/workflows/:module" element={<WorkflowEdit />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
