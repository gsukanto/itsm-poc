import React from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, Grid, Paper, Typography } from '@mui/material';
import { useProblemQuery } from '../../services/api';
import { PageHeader } from '../../components/PageBits';
import { StatusChip } from '../../components/StatusChip';

export function ProblemDetail() {
  const { id = '' } = useParams();
  const { data: p } = useProblemQuery(id);
  if (!p) return null;
  return (
    <>
      <PageHeader title={`${p.refNo} — ${p.title}`} action={<StatusChip value={p.status} />} />
      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">Description</Typography>
            <Typography sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>{p.description}</Typography>
            <Typography variant="subtitle2" color="text.secondary">Root Cause</Typography>
            <Typography sx={{ whiteSpace: 'pre-wrap' }}>{p.rootCause ?? '—'}</Typography>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>Workaround</Typography>
            <Typography sx={{ whiteSpace: 'pre-wrap' }}>{p.workaround ?? '—'}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card><CardContent>
            <Typography variant="subtitle2" color="text.secondary">Priority</Typography>
            <StatusChip value={p.priority} />
            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>Linked Incidents</Typography>
            {(p.relatedIncidents ?? []).map((i: any) => <Typography key={i.id}>{i.refNo}</Typography>)}
            {(p.relatedIncidents ?? []).length === 0 && <Typography>—</Typography>}
          </CardContent></Card>
        </Grid>
      </Grid>
    </>
  );
}
