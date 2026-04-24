import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box, Button, Card, CardContent, Divider, Grid, MenuItem, Paper, Stack, Tab, Tabs,
  TextField, Typography,
} from '@mui/material';
import {
  useIncidentQuery, useUpdateIncidentMutation, useResolveIncidentMutation, useCloseIncidentMutation,
  useIncidentWorklogQuery, useAddIncidentWorklogMutation,
} from '../../services/api';
import { PageHeader } from '../../components/PageBits';
import { StatusChip } from '../../components/StatusChip';

export function IncidentDetail() {
  const { id = '' } = useParams();
  const { data: inc } = useIncidentQuery(id);
  const { data: log = [] } = useIncidentWorklogQuery(id);
  const [update] = useUpdateIncidentMutation();
  const [resolve] = useResolveIncidentMutation();
  const [close] = useCloseIncidentMutation();
  const [addLog] = useAddIncidentWorklogMutation();
  const [tab, setTab] = useState(0);
  const [worklog, setWorklog] = useState('');
  const [resolution, setResolution] = useState('');

  if (!inc) return null;
  return (
    <>
      <PageHeader
        title={`${inc.refNo} — ${inc.title}`}
        action={
          <Stack direction="row" spacing={1}>
            <StatusChip value={inc.priority} />
            <StatusChip value={inc.status} />
          </Stack>
        }
      />
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Details" /><Tab label="Worklog" /><Tab label="Resolve" />
      </Tabs>

      {tab === 0 && (
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">Description</Typography>
              <Typography sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>{inc.description}</Typography>
              <Divider sx={{ my: 2 }} />
              <Stack direction="row" spacing={2}>
                <TextField select size="small" label="Status" value={inc.status} onChange={(e) => update({ id, body: { status: e.target.value } })}>
                  {['new','in_progress','on_hold','resolved','closed','cancelled'].map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField>
                <TextField select size="small" label="Urgency" value={inc.urgency} onChange={(e) => update({ id, body: { urgency: e.target.value } })}>
                  {['low','medium','high','critical'].map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField>
                <TextField select size="small" label="Impact" value={inc.impact} onChange={(e) => update({ id, body: { impact: e.target.value } })}>
                  {['low','medium','high','critical'].map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField>
              </Stack>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card><CardContent>
              <Typography variant="subtitle2" color="text.secondary">Requester</Typography>
              <Typography>{inc.requester?.email ?? '—'}</Typography>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>Assignee</Typography>
              <Typography>{inc.assignee?.email ?? 'Unassigned'}</Typography>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>SLA Due</Typography>
              <Typography>{inc.slaDueAt ? new Date(inc.slaDueAt).toLocaleString() : '—'}</Typography>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>Created</Typography>
              <Typography>{new Date(inc.createdAt).toLocaleString()}</Typography>
            </CardContent></Card>
          </Grid>
        </Grid>
      )}

      {tab === 1 && (
        <Paper sx={{ p: 2 }}>
          <Stack spacing={1} sx={{ mb: 2 }}>
            <TextField multiline minRows={2} label="Add worklog entry" value={worklog} onChange={(e) => setWorklog(e.target.value)} />
            <Box><Button variant="contained" onClick={async () => { await addLog({ id, body: worklog }); setWorklog(''); }}>Post</Button></Box>
          </Stack>
          <Divider />
          {log.map((w: any) => (
            <Box key={w.id} sx={{ py: 1, borderBottom: '1px solid #eee' }}>
              <Typography variant="caption" color="text.secondary">{new Date(w.createdAt).toLocaleString()} — {w.author?.email}</Typography>
              <Typography sx={{ whiteSpace: 'pre-wrap' }}>{w.body}</Typography>
            </Box>
          ))}
        </Paper>
      )}

      {tab === 2 && (
        <Paper sx={{ p: 2, maxWidth: 720 }}>
          <Stack spacing={2}>
            <TextField multiline minRows={4} label="Resolution" value={resolution} onChange={(e) => setResolution(e.target.value)} />
            <Stack direction="row" spacing={1}>
              <Button variant="contained" color="success" disabled={!resolution} onClick={() => resolve({ id, resolution })}>Resolve</Button>
              <Button variant="outlined" onClick={() => close(id)}>Close</Button>
            </Stack>
          </Stack>
        </Paper>
      )}
    </>
  );
}
