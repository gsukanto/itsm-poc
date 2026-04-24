import React from 'react';
import { useParams } from 'react-router-dom';
import { Button, Card, CardContent, Grid, Paper, Stack, Typography } from '@mui/material';
import { useChangeQuery, useSubmitCabMutation, useUpdateChangeMutation } from '../../services/api';
import { PageHeader } from '../../components/PageBits';
import { StatusChip } from '../../components/StatusChip';

export function ChangeDetail() {
  const { id = '' } = useParams();
  const { data: c } = useChangeQuery(id);
  const [submitCab] = useSubmitCabMutation();
  const [update] = useUpdateChangeMutation();
  if (!c) return null;
  return (
    <>
      <PageHeader title={`${c.refNo} — ${c.title}`} action={<Stack direction="row" spacing={1}>
        <StatusChip value={c.risk} /><StatusChip value={c.status} />
      </Stack>} />
      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">Description</Typography>
            <Typography sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>{c.description}</Typography>
            <Typography variant="subtitle2" color="text.secondary">Implementation Plan</Typography>
            <Typography sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>{c.implementationPlan ?? '—'}</Typography>
            <Typography variant="subtitle2" color="text.secondary">Backout Plan</Typography>
            <Typography sx={{ whiteSpace: 'pre-wrap' }}>{c.backoutPlan ?? '—'}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card><CardContent>
            <Typography variant="subtitle2">Type</Typography><Typography>{c.changeType}</Typography>
            <Typography variant="subtitle2" sx={{ mt: 2 }}>Risk Score</Typography><Typography>{c.riskScore} ({c.risk})</Typography>
            <Typography variant="subtitle2" sx={{ mt: 2 }}>Window</Typography>
            <Typography>{c.startAt ? new Date(c.startAt).toLocaleString() : '—'} → {c.endAt ? new Date(c.endAt).toLocaleString() : '—'}</Typography>
            <Stack spacing={1} sx={{ mt: 2 }}>
              {c.status === 'draft' && <Button variant="contained" onClick={() => submitCab({ id, approvers: [] })}>Submit to CAB</Button>}
              {c.status === 'approved' && <Button onClick={() => update({ id, body: { status: 'in_progress' } })}>Start Implementation</Button>}
              {c.status === 'in_progress' && <Button onClick={() => update({ id, body: { status: 'completed' } })}>Mark Complete</Button>}
            </Stack>
          </CardContent></Card>
          <Card sx={{ mt: 2 }}><CardContent>
            <Typography variant="h6">CAB Approvals</Typography>
            {(c.approvals ?? []).map((a: any) => (
              <Typography key={a.id} variant="body2">{a.approver?.email}: <StatusChip value={a.decision ?? 'pending'} /></Typography>
            ))}
          </CardContent></Card>
        </Grid>
      </Grid>
    </>
  );
}
