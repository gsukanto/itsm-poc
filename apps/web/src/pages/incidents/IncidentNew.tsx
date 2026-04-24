import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, MenuItem, Paper, Stack, TextField } from '@mui/material';
import { useCreateIncidentMutation } from '../../services/api';
import { PageHeader } from '../../components/PageBits';

export function IncidentNew() {
  const nav = useNavigate();
  const [createIncident, { isLoading }] = useCreateIncidentMutation();
  const [form, setForm] = useState({ title: '', description: '', urgency: 'medium', impact: 'medium' });
  const submit = async () => {
    const r: any = await createIncident(form).unwrap();
    nav(`/incidents/${r.id}`);
  };
  return (
    <>
      <PageHeader title="New Incident" />
      <Paper sx={{ p: 3, maxWidth: 720 }}>
        <Stack spacing={2}>
          <TextField label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <TextField label="Description" multiline minRows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Stack direction="row" spacing={2}>
            <TextField select label="Urgency" value={form.urgency} onChange={(e) => setForm({ ...form, urgency: e.target.value })} sx={{ flex: 1 }}>
              {['low','medium','high','critical'].map((u) => <MenuItem key={u} value={u}>{u}</MenuItem>)}
            </TextField>
            <TextField select label="Impact" value={form.impact} onChange={(e) => setForm({ ...form, impact: e.target.value })} sx={{ flex: 1 }}>
              {['low','medium','high','critical'].map((u) => <MenuItem key={u} value={u}>{u}</MenuItem>)}
            </TextField>
          </Stack>
          <Box>
            <Button variant="contained" onClick={submit} disabled={isLoading || !form.title}>Create</Button>
          </Box>
        </Stack>
      </Paper>
    </>
  );
}
