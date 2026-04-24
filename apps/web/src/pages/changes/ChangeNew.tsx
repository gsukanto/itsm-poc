import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, MenuItem, Paper, Stack, TextField } from '@mui/material';
import { useCreateChangeMutation } from '../../services/api';
import { PageHeader } from '../../components/PageBits';

export function ChangeNew() {
  const nav = useNavigate();
  const [create, { isLoading }] = useCreateChangeMutation();
  const [f, setF] = useState({
    title: '', description: '', changeType: 'normal', impact: 'medium', urgency: 'medium',
    implementationPlan: '', backoutPlan: '', testPlan: '',
    startAt: '', endAt: '',
  });
  const submit = async () => {
    const body: any = { ...f, startAt: f.startAt ? new Date(f.startAt).toISOString() : undefined, endAt: f.endAt ? new Date(f.endAt).toISOString() : undefined };
    const r: any = await create(body).unwrap();
    nav(`/changes/${r.id}`);
  };
  return (
    <>
      <PageHeader title="New Change Request" />
      <Paper sx={{ p: 3, maxWidth: 800 }}>
        <Stack spacing={2}>
          <TextField label="Title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
          <TextField label="Description" multiline minRows={3} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
          <Stack direction="row" spacing={2}>
            <TextField select label="Type" value={f.changeType} onChange={(e) => setF({ ...f, changeType: e.target.value })} sx={{ flex: 1 }}>
              {['standard','normal','emergency'].map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </TextField>
            <TextField select label="Impact" value={f.impact} onChange={(e) => setF({ ...f, impact: e.target.value })} sx={{ flex: 1 }}>
              {['low','medium','high','critical'].map((u) => <MenuItem key={u} value={u}>{u}</MenuItem>)}
            </TextField>
            <TextField select label="Urgency" value={f.urgency} onChange={(e) => setF({ ...f, urgency: e.target.value })} sx={{ flex: 1 }}>
              {['low','medium','high','critical'].map((u) => <MenuItem key={u} value={u}>{u}</MenuItem>)}
            </TextField>
          </Stack>
          <Stack direction="row" spacing={2}>
            <TextField type="datetime-local" label="Start" InputLabelProps={{ shrink: true }} value={f.startAt} onChange={(e) => setF({ ...f, startAt: e.target.value })} sx={{ flex: 1 }} />
            <TextField type="datetime-local" label="End" InputLabelProps={{ shrink: true }} value={f.endAt} onChange={(e) => setF({ ...f, endAt: e.target.value })} sx={{ flex: 1 }} />
          </Stack>
          <TextField label="Implementation Plan" multiline minRows={2} value={f.implementationPlan} onChange={(e) => setF({ ...f, implementationPlan: e.target.value })} />
          <TextField label="Backout Plan" multiline minRows={2} value={f.backoutPlan} onChange={(e) => setF({ ...f, backoutPlan: e.target.value })} />
          <TextField label="Test Plan" multiline minRows={2} value={f.testPlan} onChange={(e) => setF({ ...f, testPlan: e.target.value })} />
          <Button variant="contained" onClick={submit} disabled={isLoading || !f.title}>Create</Button>
        </Stack>
      </Paper>
    </>
  );
}
