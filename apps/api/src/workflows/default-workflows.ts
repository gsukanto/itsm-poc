/**
 * Default workflow definitions per module. Mirrors the status comments in
 * prisma/schema.prisma. The last state of each module is treated as terminal
 * and gated by approval.
 */

export interface DefaultStateDef {
  key: string;
  label: string;
  color: string;
  isInitial?: boolean;
  isTerminal?: boolean;
  requiresApproval?: boolean;
  approverRoleKey?: string;
  approverGroupKey?: string;
}

export interface DefaultWorkflow {
  module: string;
  name: string;
  description?: string;
  states: DefaultStateDef[];
  transitions: Array<[string, string, string?]>;
}

const APPROVER_ROLE = 'approver';

export const DEFAULT_WORKFLOWS: DefaultWorkflow[] = [
  {
    module: 'incident',
    name: 'Incident lifecycle',
    states: [
      { key: 'new', label: 'New', color: '#90caf9', isInitial: true },
      { key: 'assigned', label: 'Assigned', color: '#64b5f6' },
      { key: 'in_progress', label: 'In Progress', color: '#1976d2' },
      { key: 'pending', label: 'Pending', color: '#ffb74d' },
      { key: 'resolved', label: 'Resolved', color: '#81c784' },
      { key: 'closed', label: 'Closed', color: '#4caf50', isTerminal: true, requiresApproval: true, approverRoleKey: APPROVER_ROLE },
      { key: 'cancelled', label: 'Cancelled', color: '#bdbdbd' },
    ],
    transitions: [
      ['new', 'assigned'], ['new', 'in_progress'], ['new', 'cancelled'],
      ['assigned', 'in_progress'], ['assigned', 'pending'], ['assigned', 'cancelled'],
      ['in_progress', 'pending'], ['in_progress', 'resolved'],
      ['pending', 'in_progress'], ['pending', 'resolved'],
      ['resolved', 'closed'], ['resolved', 'in_progress'],
    ],
  },
  {
    module: 'service_request',
    name: 'Service Request lifecycle',
    states: [
      { key: 'new', label: 'New', color: '#90caf9', isInitial: true },
      { key: 'approval_pending', label: 'Awaiting Approval', color: '#ffb74d' },
      { key: 'approved', label: 'Approved', color: '#aed581' },
      { key: 'fulfilment', label: 'Fulfilment', color: '#1976d2' },
      { key: 'resolved', label: 'Resolved', color: '#81c784' },
      { key: 'closed', label: 'Closed', color: '#4caf50', isTerminal: true, requiresApproval: true, approverRoleKey: APPROVER_ROLE },
      { key: 'rejected', label: 'Rejected', color: '#e57373' },
      { key: 'cancelled', label: 'Cancelled', color: '#bdbdbd' },
    ],
    transitions: [
      ['new', 'approval_pending'], ['new', 'cancelled'],
      ['approval_pending', 'approved'], ['approval_pending', 'rejected'],
      ['approved', 'fulfilment'],
      ['fulfilment', 'resolved'], ['fulfilment', 'cancelled'],
      ['resolved', 'closed'],
    ],
  },
  {
    module: 'problem',
    name: 'Problem lifecycle',
    states: [
      { key: 'new', label: 'New', color: '#90caf9', isInitial: true },
      { key: 'investigation', label: 'Investigation', color: '#1976d2' },
      { key: 'known_error', label: 'Known Error', color: '#ffb74d' },
      { key: 'resolved', label: 'Resolved', color: '#81c784' },
      { key: 'closed', label: 'Closed', color: '#4caf50', isTerminal: true, requiresApproval: true, approverRoleKey: APPROVER_ROLE },
    ],
    transitions: [
      ['new', 'investigation'],
      ['investigation', 'known_error'], ['investigation', 'resolved'],
      ['known_error', 'resolved'],
      ['resolved', 'closed'],
    ],
  },
  {
    module: 'change',
    name: 'Change Enablement',
    states: [
      { key: 'draft', label: 'Draft', color: '#bdbdbd', isInitial: true },
      { key: 'assess', label: 'Assess', color: '#90caf9' },
      { key: 'cab_review', label: 'CAB Review', color: '#ffb74d' },
      { key: 'approved', label: 'Approved', color: '#aed581' },
      { key: 'scheduled', label: 'Scheduled', color: '#64b5f6' },
      { key: 'implementation', label: 'Implementation', color: '#1976d2' },
      { key: 'review', label: 'Review', color: '#9575cd' },
      { key: 'closed', label: 'Closed', color: '#4caf50', isTerminal: true, requiresApproval: true, approverRoleKey: APPROVER_ROLE },
      { key: 'rejected', label: 'Rejected', color: '#e57373' },
      { key: 'cancelled', label: 'Cancelled', color: '#bdbdbd' },
    ],
    transitions: [
      ['draft', 'assess'], ['draft', 'cancelled'],
      ['assess', 'cab_review'], ['assess', 'cancelled'],
      ['cab_review', 'approved'], ['cab_review', 'rejected'],
      ['approved', 'scheduled'],
      ['scheduled', 'implementation'], ['scheduled', 'cancelled'],
      ['implementation', 'review'],
      ['review', 'closed'],
    ],
  },
  {
    module: 'release',
    name: 'Release & Deployment',
    states: [
      { key: 'planning', label: 'Planning', color: '#bdbdbd', isInitial: true },
      { key: 'build', label: 'Build', color: '#90caf9' },
      { key: 'uat', label: 'UAT', color: '#ffb74d' },
      { key: 'deploy', label: 'Deploy', color: '#1976d2' },
      { key: 'review', label: 'Review', color: '#9575cd' },
      { key: 'closed', label: 'Closed', color: '#4caf50', isTerminal: true, requiresApproval: true, approverRoleKey: APPROVER_ROLE },
      { key: 'cancelled', label: 'Cancelled', color: '#bdbdbd' },
    ],
    transitions: [
      ['planning', 'build'], ['planning', 'cancelled'],
      ['build', 'uat'], ['build', 'cancelled'],
      ['uat', 'deploy'], ['uat', 'build'],
      ['deploy', 'review'],
      ['review', 'closed'],
    ],
  },
  {
    module: 'knowledge',
    name: 'Knowledge article lifecycle',
    states: [
      { key: 'draft', label: 'Draft', color: '#bdbdbd', isInitial: true },
      { key: 'review', label: 'Review', color: '#90caf9' },
      { key: 'published', label: 'Published', color: '#4caf50', isTerminal: true, requiresApproval: true, approverRoleKey: APPROVER_ROLE },
      { key: 'retired', label: 'Retired', color: '#9e9e9e' },
    ],
    transitions: [
      ['draft', 'review'],
      ['review', 'published'], ['review', 'draft'],
      ['published', 'retired'],
    ],
  },
  {
    module: 'event',
    name: 'Event lifecycle',
    states: [
      { key: 'open', label: 'Open', color: '#e57373', isInitial: true },
      { key: 'acknowledged', label: 'Acknowledged', color: '#ffb74d' },
      { key: 'suppressed', label: 'Suppressed', color: '#9e9e9e' },
      { key: 'closed', label: 'Closed', color: '#4caf50', isTerminal: true, requiresApproval: true, approverRoleKey: APPROVER_ROLE },
    ],
    transitions: [
      ['open', 'acknowledged'], ['open', 'suppressed'],
      ['acknowledged', 'closed'],
      ['suppressed', 'closed'],
    ],
  },
  {
    module: 'asset',
    name: 'Asset lifecycle',
    states: [
      { key: 'in_stock', label: 'In Stock', color: '#90caf9', isInitial: true },
      { key: 'in_use', label: 'In Use', color: '#1976d2' },
      { key: 'maintenance', label: 'Maintenance', color: '#ffb74d' },
      { key: 'lost', label: 'Lost', color: '#e57373' },
      { key: 'retired', label: 'Retired', color: '#4caf50', isTerminal: true, requiresApproval: true, approverRoleKey: APPROVER_ROLE },
    ],
    transitions: [
      ['in_stock', 'in_use'], ['in_stock', 'lost'],
      ['in_use', 'maintenance'], ['in_use', 'lost'],
      ['maintenance', 'in_use'], ['maintenance', 'retired'],
    ],
  },
  {
    module: 'contract',
    name: 'Supplier contract lifecycle',
    states: [
      { key: 'active', label: 'Active', color: '#1976d2', isInitial: true },
      { key: 'expired', label: 'Expired', color: '#9e9e9e' },
      { key: 'terminated', label: 'Terminated', color: '#4caf50', isTerminal: true, requiresApproval: true, approverRoleKey: APPROVER_ROLE },
    ],
    transitions: [
      ['active', 'expired'],
      ['active', 'terminated'],
      ['expired', 'terminated'],
    ],
  },
  {
    module: 'fulfilment_task',
    name: 'Fulfilment task lifecycle',
    states: [
      { key: 'pending', label: 'Pending', color: '#bdbdbd', isInitial: true },
      { key: 'in_progress', label: 'In Progress', color: '#1976d2' },
      { key: 'skipped', label: 'Skipped', color: '#9e9e9e' },
      { key: 'done', label: 'Done', color: '#4caf50', isTerminal: true, requiresApproval: true, approverRoleKey: APPROVER_ROLE },
    ],
    transitions: [
      ['pending', 'in_progress'], ['pending', 'skipped'],
      ['in_progress', 'done'],
    ],
  },
];

/** Map module key → Prisma model accessor name on PrismaService */
export const MODULE_TO_MODEL: Record<string, string> = {
  incident: 'incident',
  service_request: 'serviceRequest',
  problem: 'problem',
  change: 'changeRequest',
  release: 'release',
  knowledge: 'kbArticle',
  event: 'eventRecord',
  asset: 'asset',
  contract: 'contract',
  fulfilment_task: 'fulfilmentTask',
};
