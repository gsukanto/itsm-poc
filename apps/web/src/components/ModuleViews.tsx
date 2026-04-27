import React, { useMemo, useState } from 'react';
import {
  Box, Stack, ToggleButton, ToggleButtonGroup, Card, CardContent, Typography,
  Chip, Dialog, DialogTitle, DialogContent, DialogActions, Button, Alert, Grid,
} from '@mui/material';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import { GridColDef } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import {
  DndContext, useDraggable, useDroppable, DragEndEvent, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import { ListGrid } from './PageBits';
import { useWorkflowQuery, useTransitionMutation } from '../services/api';

type ViewMode = 'list' | 'board' | 'cards';

export interface ModuleViewsProps {
  module: string; // workflow module key, e.g. "incident"
  rows: any[];
  columns: GridColDef[];
  loading?: boolean;
  linkTo: (row: any) => string;
  cardRender?: (row: any) => React.ReactNode;
  /** Field name on row that holds the status value. Default: "status". */
  statusField?: string;
  /** Optional: which view modes to allow. Default: all three. */
  allowed?: ViewMode[];
}

function prefKey(module: string) { return `mv:view:${module}`; }

export function ModuleViews(props: ModuleViewsProps) {
  const { module, rows, columns, loading, linkTo, cardRender, statusField = 'status', allowed = ['list', 'board', 'cards'] } = props;
  const [view, setView] = useState<ViewMode>(() => {
    const v = (typeof localStorage !== 'undefined' && localStorage.getItem(prefKey(module))) as ViewMode | null;
    return v && allowed.includes(v) ? v : allowed[0];
  });
  const setViewPersist = (v: ViewMode) => {
    setView(v);
    try { localStorage.setItem(prefKey(module), v); } catch {}
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="flex-end" sx={{ mb: 1 }}>
        <ToggleButtonGroup size="small" exclusive value={view} onChange={(_, v) => v && setViewPersist(v)}>
          {allowed.includes('list') && <ToggleButton value="list" title="List"><ViewListIcon fontSize="small" /></ToggleButton>}
          {allowed.includes('board') && <ToggleButton value="board" title="Board (swimlane)"><ViewKanbanIcon fontSize="small" /></ToggleButton>}
          {allowed.includes('cards') && <ToggleButton value="cards" title="Cards"><ViewModuleIcon fontSize="small" /></ToggleButton>}
        </ToggleButtonGroup>
      </Stack>
      {view === 'list' && <ListGrid rows={rows} columns={columns} loading={loading} linkTo={linkTo} />}
      {view === 'board' && <BoardView module={module} rows={rows} statusField={statusField} linkTo={linkTo} cardRender={cardRender} />}
      {view === 'cards' && <CardsView rows={rows} linkTo={linkTo} cardRender={cardRender} statusField={statusField} />}
    </Box>
  );
}

// ============================================================
// Board (Kanban) view
// ============================================================
function BoardView({
  module, rows, statusField, linkTo, cardRender,
}: {
  module: string; rows: any[]; statusField: string; linkTo: (r: any) => string; cardRender?: (r: any) => React.ReactNode;
}) {
  const { data: wf } = useWorkflowQuery(module);
  const [transition, { isLoading: posting }] = useTransitionMutation();
  const [confirm, setConfirm] = useState<{ row: any; toState: any } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const grouped = useMemo(() => {
    if (!wf) return {};
    const map: Record<string, any[]> = {};
    for (const s of wf.states) map[s.key] = [];
    for (const r of rows) {
      const k = r[statusField];
      if (map[k]) map[k].push(r);
      else { (map['__other'] = map['__other'] ?? []).push(r); }
    }
    return map;
  }, [rows, wf, statusField]);

  if (!wf) return <Box sx={{ p: 2 }}>Loading workflow…</Box>;

  const onDragEnd = async (e: DragEndEvent) => {
    const fromRow = e.active.data.current?.row;
    const toKey = String(e.over?.id ?? '');
    if (!fromRow || !toKey || fromRow[statusField] === toKey) return;
    const toState = wf.states.find((s: any) => s.key === toKey);
    if (!toState) return;
    if (toState.requiresApproval) {
      setConfirm({ row: fromRow, toState });
      return;
    }
    try {
      await transition({ module, id: fromRow.id, toStatus: toKey }).unwrap();
    } catch (err: any) {
      setError(err?.data?.message || err?.message || 'Transition failed');
    }
  };

  const submitGated = async () => {
    if (!confirm) return;
    try {
      await transition({ module, id: confirm.row.id, toStatus: confirm.toState.key }).unwrap();
      setConfirm(null);
    } catch (err: any) {
      setError(err?.data?.message || err?.message || 'Transition failed');
      setConfirm(null);
    }
  };

  return (
    <Box>
      {error && <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 1 }}>{error}</Alert>}
      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <Box sx={{ display: 'flex', gap: 1.5, overflowX: 'auto', pb: 1, height: 'calc(100vh - 240px)' }}>
          {wf.states.map((s: any) => (
            <Column key={s.id} state={s} items={grouped[s.key] ?? []} linkTo={linkTo} cardRender={cardRender} />
          ))}
          {(grouped['__other']?.length ?? 0) > 0 && (
            <Column
              state={{ id: '__other', key: '__other', label: 'Other', color: '#bdbdbd', requiresApproval: false, isTerminal: false }}
              items={grouped['__other']!}
              linkTo={linkTo}
              cardRender={cardRender}
              droppable={false}
            />
          )}
        </Box>
      </DndContext>
      <Dialog open={!!confirm} onClose={() => setConfirm(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Submit for approval?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Moving to <b>{confirm?.toState.label}</b> requires approval
            {confirm?.toState.approverGroupKey && <> from group <b>{confirm.toState.approverGroupKey}</b></>}
            {!confirm?.toState.approverGroupKey && confirm?.toState.approverRoleKey && <> from role <b>{confirm.toState.approverRoleKey}</b></>}
            . The item will stay in its current state until approved.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirm(null)}>Cancel</Button>
          <Button variant="contained" onClick={submitGated} disabled={posting}>Submit</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function Column({
  state, items, linkTo, cardRender, droppable = true,
}: {
  state: any; items: any[]; linkTo: (r: any) => string; cardRender?: (r: any) => React.ReactNode; droppable?: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: state.key, disabled: !droppable });
  return (
    <Box
      ref={droppable ? setNodeRef : undefined}
      sx={{
        minWidth: 280, maxWidth: 320, flex: '0 0 290px',
        bgcolor: isOver ? 'action.hover' : 'background.paper',
        border: 1, borderColor: 'divider', borderRadius: 1, p: 1,
        display: 'flex', flexDirection: 'column', height: '100%',
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: state.color }} />
          <Typography variant="subtitle2">{state.label}</Typography>
          {state.requiresApproval && <Chip size="small" label="approval" color="warning" sx={{ height: 18 }} />}
          {state.isTerminal && <Chip size="small" label="final" sx={{ height: 18 }} />}
        </Stack>
        <Chip size="small" label={items.length} />
      </Stack>
      <Box sx={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
        {items.map((r) => (
          <DraggableCard key={r.id} row={r} linkTo={linkTo} cardRender={cardRender} />
        ))}
      </Box>
    </Box>
  );
}

function DraggableCard({ row, linkTo, cardRender }: { row: any; linkTo: (r: any) => string; cardRender?: (r: any) => React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: row.id, data: { row } });
  const nav = useNavigate();
  const style: React.CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.6 : 1,
    cursor: 'grab',
  };
  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        if (isDragging) return;
        // small click: navigate; drag is captured by dnd-kit via activation distance
        e.stopPropagation();
        nav(linkTo(row));
      }}
      variant="outlined"
      sx={{ '&:hover': { borderColor: 'primary.main' } }}
    >
      <CardContent sx={{ p: 1.25, '&:last-child': { pb: 1.25 } }}>
        {cardRender ? cardRender(row) : <DefaultCardBody row={row} />}
      </CardContent>
    </Card>
  );
}

function DefaultCardBody({ row }: { row: any }) {
  return (
    <Stack spacing={0.5}>
      <Typography variant="caption" color="text.secondary">{row.refNo ?? row.key ?? row.id?.slice(0, 8)}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>{row.title ?? row.name ?? row.subject ?? '—'}</Typography>
      <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap' }}>
        {row.priority && <Chip size="small" label={row.priority} />}
        {row.severity && <Chip size="small" label={row.severity} />}
        {row.assignee?.displayName && <Chip size="small" variant="outlined" label={row.assignee.displayName} />}
      </Stack>
    </Stack>
  );
}

// ============================================================
// Cards view (responsive grid, no swimlane grouping)
// ============================================================
function CardsView({
  rows, linkTo, cardRender, statusField,
}: {
  rows: any[]; linkTo: (r: any) => string; cardRender?: (r: any) => React.ReactNode; statusField: string;
}) {
  const nav = useNavigate();
  return (
    <Box sx={{ height: 'calc(100vh - 240px)', overflowY: 'auto', pr: 1 }}>
      <Grid container spacing={1.5}>
        {rows.map((r) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={r.id}>
            <Card variant="outlined" sx={{ cursor: 'pointer', '&:hover': { borderColor: 'primary.main' } }} onClick={() => nav(linkTo(r))}>
              <CardContent>
                {cardRender ? cardRender(r) : <DefaultCardBody row={r} />}
                {r[statusField] && <Chip size="small" label={r[statusField]} sx={{ mt: 1 }} />}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
