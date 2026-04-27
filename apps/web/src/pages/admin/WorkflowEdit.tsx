import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert, Box, Button, Card, CardContent, Checkbox, FormControlLabel, IconButton, MenuItem,
  Stack, TextField, Typography, Divider, Chip,
} from '@mui/material';
import { ArrowBack, Add, Delete, Save } from '@mui/icons-material';
import { PageHeader } from '../../components/PageBits';
import { useUpdateWorkflowMutation, useWorkflowQuery } from '../../services/api';

interface StateRow {
  key: string;
  label: string;
  color: string;
  isInitial: boolean;
  isTerminal: boolean;
  requiresApproval: boolean;
  approverRoleKey: string;
  approverGroupKey: string;
}
interface TransitionRow { from: string; to: string; label?: string }

export function WorkflowEdit() {
  const { module = '' } = useParams();
  const nav = useNavigate();
  const { data: wf, isFetching, refetch } = useWorkflowQuery(module);
  const [save, { isLoading: saving }] = useUpdateWorkflowMutation();
  const [states, setStates] = useState<StateRow[]>([]);
  const [transitions, setTransitions] = useState<TransitionRow[]>([]);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!wf) return;
    setName(wf.name);
    setStates(wf.states.map((s: any) => ({
      key: s.key, label: s.label, color: s.color,
      isInitial: s.isInitial, isTerminal: s.isTerminal, requiresApproval: s.requiresApproval,
      approverRoleKey: s.approverRoleKey || '', approverGroupKey: s.approverGroupKey || '',
    })));
    const idToKey: Record<string, string> = Object.fromEntries(wf.states.map((s: any) => [s.id, s.key]));
    setTransitions(wf.transitions.map((t: any) => ({ from: idToKey[t.fromStateId], to: idToKey[t.toStateId], label: t.label || undefined })));
  }, [wf]);

  const stateKeys = useMemo(() => states.map((s) => s.key), [states]);

  const addState = () => setStates([...states, { key: `state_${states.length + 1}`, label: 'New State', color: '#9e9e9e', isInitial: false, isTerminal: false, requiresApproval: false, approverRoleKey: '', approverGroupKey: '' }]);
  const removeState = (i: number) => {
    const removedKey = states[i].key;
    setStates(states.filter((_, x) => x !== i));
    setTransitions(transitions.filter((t) => t.from !== removedKey && t.to !== removedKey));
  };
  const updateState = (i: number, patch: Partial<StateRow>) => setStates(states.map((s, x) => x === i ? { ...s, ...patch } : s));

  const addTransition = () => stateKeys[0] && stateKeys[1] && setTransitions([...transitions, { from: stateKeys[0], to: stateKeys[1] }]);
  const removeTransition = (i: number) => setTransitions(transitions.filter((_, x) => x !== i));
  const updateTransition = (i: number, patch: Partial<TransitionRow>) => setTransitions(transitions.map((t, x) => x === i ? { ...t, ...patch } : t));

  const onSave = async () => {
    setError(null); setSuccess(false);
    if (!states.some((s) => s.isInitial)) { setError('At least one state must be marked Initial'); return; }
    if (!states.some((s) => s.isTerminal)) { setError('At least one state must be marked Terminal'); return; }
    const seen = new Set<string>();
    for (const s of states) { if (seen.has(s.key)) { setError(`Duplicate state key: ${s.key}`); return; } seen.add(s.key); }
    try {
      await save({ module, body: { name, states: states.map((s, idx) => ({ ...s, order: idx })), transitions } }).unwrap();
      setSuccess(true);
      refetch();
    } catch (e: any) {
      setError(e?.data?.message || e?.message || 'Save failed');
    }
  };

  if (isFetching && !wf) return <Typography>Loading…</Typography>;

  return (
    <>
      <PageHeader
        title={`Workflow: ${module}`}
        action={
          <Stack direction="row" spacing={1}>
            <Button startIcon={<ArrowBack />} onClick={() => nav('/admin/workflows')}>Back</Button>
            <Button startIcon={<Save />} variant="contained" disabled={saving} onClick={onSave}>Save</Button>
          </Stack>
        }
      />
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(false)}>Workflow saved.</Alert>}
      <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} sx={{ mb: 2, width: 320 }} />
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="h6">States</Typography>
            <Button size="small" startIcon={<Add />} onClick={addState}>Add state</Button>
          </Stack>
          <Stack spacing={1}>
            {states.map((s, i) => (
              <Box key={i} sx={{ display: 'grid', gridTemplateColumns: '120px 160px 80px 1fr 1fr 80px 80px 100px 40px', gap: 1, alignItems: 'center' }}>
                <TextField size="small" label="Key" value={s.key} onChange={(e) => updateState(i, { key: e.target.value })} />
                <TextField size="small" label="Label" value={s.label} onChange={(e) => updateState(i, { label: e.target.value })} />
                <TextField size="small" type="color" label="Color" value={s.color} onChange={(e) => updateState(i, { color: e.target.value })} InputLabelProps={{ shrink: true }} />
                <TextField size="small" label="Approver Role" placeholder="role key e.g. approver" value={s.approverRoleKey} onChange={(e) => updateState(i, { approverRoleKey: e.target.value })} />
                <TextField size="small" label="Approver Group" placeholder="group key" value={s.approverGroupKey} onChange={(e) => updateState(i, { approverGroupKey: e.target.value })} />
                <FormControlLabel control={<Checkbox checked={s.isInitial} onChange={(e) => updateState(i, { isInitial: e.target.checked })} />} label="initial" />
                <FormControlLabel control={<Checkbox checked={s.isTerminal} onChange={(e) => updateState(i, { isTerminal: e.target.checked })} />} label="final" />
                <FormControlLabel control={<Checkbox checked={s.requiresApproval} onChange={(e) => updateState(i, { requiresApproval: e.target.checked })} />} label="approval" />
                <IconButton onClick={() => removeState(i)} size="small"><Delete fontSize="small" /></IconButton>
              </Box>
            ))}
          </Stack>
        </CardContent>
      </Card>
      <Card variant="outlined">
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="h6">Transitions</Typography>
            <Button size="small" startIcon={<Add />} onClick={addTransition}>Add transition</Button>
          </Stack>
          <Stack spacing={1}>
            {transitions.map((t, i) => (
              <Box key={i} sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 40px', gap: 1, alignItems: 'center' }}>
                <TextField select size="small" label="From" value={t.from} onChange={(e) => updateTransition(i, { from: e.target.value })}>
                  {stateKeys.map((k) => <MenuItem key={k} value={k}>{k}</MenuItem>)}
                </TextField>
                <TextField select size="small" label="To" value={t.to} onChange={(e) => updateTransition(i, { to: e.target.value })}>
                  {stateKeys.map((k) => <MenuItem key={k} value={k}>{k}</MenuItem>)}
                </TextField>
                <TextField size="small" label="Label (optional)" value={t.label || ''} onChange={(e) => updateTransition(i, { label: e.target.value })} />
                <IconButton onClick={() => removeTransition(i)} size="small"><Delete fontSize="small" /></IconButton>
              </Box>
            ))}
          </Stack>
        </CardContent>
      </Card>
    </>
  );
}
