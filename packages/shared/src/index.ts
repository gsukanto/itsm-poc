// Shared enums + types used by api/worker/web

export const PRIORITIES = ['P1', 'P2', 'P3', 'P4', 'P5'] as const;
export type Priority = (typeof PRIORITIES)[number];

export const URGENCY = ['low', 'medium', 'high', 'critical'] as const;
export const IMPACT = ['low', 'medium', 'high'] as const;

export const INCIDENT_STATUS = [
  'new', 'assigned', 'in_progress', 'pending', 'resolved', 'closed', 'cancelled',
] as const;
export type IncidentStatus = (typeof INCIDENT_STATUS)[number];

export const SR_STATUS = [
  'new', 'approval_pending', 'approved', 'rejected', 'fulfilment', 'resolved', 'closed', 'cancelled',
] as const;
export type ServiceRequestStatus = (typeof SR_STATUS)[number];

export const PROBLEM_STATUS = ['new', 'investigation', 'known_error', 'resolved', 'closed'] as const;
export type ProblemStatus = (typeof PROBLEM_STATUS)[number];

export const CHANGE_STATUS = [
  'draft', 'assess', 'cab_review', 'approved', 'scheduled', 'implementation', 'review', 'closed', 'rejected', 'cancelled',
] as const;
export type ChangeStatus = (typeof CHANGE_STATUS)[number];

export const CHANGE_TYPES = ['standard', 'normal', 'emergency'] as const;
export type ChangeType = (typeof CHANGE_TYPES)[number];

export const RELEASE_STATUS = ['planning', 'build', 'uat', 'deploy', 'review', 'closed', 'cancelled'] as const;
export const KB_STATUS = ['draft', 'review', 'published', 'retired'] as const;
export const ASSET_STATUS = ['in_stock', 'in_use', 'maintenance', 'retired', 'lost'] as const;
export const EVENT_SEVERITY = ['info', 'warning', 'minor', 'major', 'critical'] as const;
export const EVENT_STATUS = ['open', 'acknowledged', 'suppressed', 'closed'] as const;

// Priority matrix: urgency x impact -> priority
export function priorityFromUrgencyImpact(urgency: string, impact: string): Priority {
  const u = ['low', 'medium', 'high', 'critical'].indexOf(urgency);
  const i = ['low', 'medium', 'high'].indexOf(impact);
  if (u < 0 || i < 0) return 'P3';
  // matrix (rows=urgency, cols=impact) -> priority index
  const m: Priority[][] = [
    ['P5', 'P4', 'P3'],
    ['P4', 'P3', 'P2'],
    ['P3', 'P2', 'P1'],
    ['P2', 'P1', 'P1'],
  ];
  return m[u][i];
}

export const PERMISSIONS = {
  // Incident
  INC_READ: 'incident.read', INC_WRITE: 'incident.write', INC_RESOLVE: 'incident.resolve',
  // Service Request
  SR_READ: 'sr.read', SR_WRITE: 'sr.write', SR_FULFIL: 'sr.fulfil',
  // Problem
  PRB_READ: 'problem.read', PRB_WRITE: 'problem.write',
  // Change
  CHG_READ: 'change.read', CHG_WRITE: 'change.write', CHG_APPROVE: 'change.approve',
  // CMDB
  CMDB_READ: 'cmdb.read', CMDB_WRITE: 'cmdb.write',
  // Knowledge
  KB_READ: 'kb.read', KB_WRITE: 'kb.write', KB_PUBLISH: 'kb.publish',
  // SLM
  SLM_READ: 'slm.read', SLM_WRITE: 'slm.write',
  // Event
  EVT_READ: 'event.read', EVT_WRITE: 'event.write', EVT_INGEST: 'event.ingest',
  // Availability/Capacity
  AVAIL_READ: 'availability.read', AVAIL_WRITE: 'availability.write',
  CAP_READ: 'capacity.read', CAP_WRITE: 'capacity.write',
  // Release
  REL_READ: 'release.read', REL_WRITE: 'release.write',
  // Asset
  ASSET_READ: 'asset.read', ASSET_WRITE: 'asset.write',
  // Continuity
  CONT_READ: 'continuity.read', CONT_WRITE: 'continuity.write',
  // Supplier
  SUP_READ: 'supplier.read', SUP_WRITE: 'supplier.write',
  // Financial
  FIN_READ: 'financial.read', FIN_WRITE: 'financial.write',
  // Admin
  ADMIN: 'admin.all',
} as const;

export const ALL_PERMISSIONS = Object.values(PERMISSIONS);

export const DEFAULT_ROLES = [
  { key: 'admin', name: 'Administrator', permissions: ALL_PERMISSIONS },
  { key: 'agent', name: 'Service Desk Agent', permissions: [
    PERMISSIONS.INC_READ, PERMISSIONS.INC_WRITE, PERMISSIONS.INC_RESOLVE,
    PERMISSIONS.SR_READ, PERMISSIONS.SR_WRITE, PERMISSIONS.SR_FULFIL,
    PERMISSIONS.PRB_READ, PERMISSIONS.PRB_WRITE,
    PERMISSIONS.CHG_READ, PERMISSIONS.CHG_WRITE,
    PERMISSIONS.CMDB_READ, PERMISSIONS.KB_READ, PERMISSIONS.KB_WRITE,
    PERMISSIONS.EVT_READ, PERMISSIONS.AVAIL_READ, PERMISSIONS.CAP_READ,
    PERMISSIONS.REL_READ, PERMISSIONS.ASSET_READ,
  ] },
  { key: 'approver', name: 'Approver', permissions: [
    PERMISSIONS.CHG_READ, PERMISSIONS.CHG_APPROVE, PERMISSIONS.SR_READ,
  ] },
  { key: 'manager', name: 'IT Manager', permissions: [
    PERMISSIONS.INC_READ, PERMISSIONS.SR_READ, PERMISSIONS.PRB_READ, PERMISSIONS.CHG_READ,
    PERMISSIONS.CMDB_READ, PERMISSIONS.KB_READ, PERMISSIONS.SLM_READ, PERMISSIONS.EVT_READ,
    PERMISSIONS.AVAIL_READ, PERMISSIONS.CAP_READ, PERMISSIONS.REL_READ, PERMISSIONS.ASSET_READ,
    PERMISSIONS.CONT_READ, PERMISSIONS.SUP_READ, PERMISSIONS.FIN_READ,
  ] },
  { key: 'enduser', name: 'End User', permissions: [
    PERMISSIONS.INC_READ, PERMISSIONS.SR_READ, PERMISSIONS.KB_READ,
  ] },
];
