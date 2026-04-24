import React from 'react';
import { useParams } from 'react-router-dom';
import { Box, Card, CardContent, Grid, Paper, Typography } from '@mui/material';
import { useCiImpactQuery, useCiQuery } from '../../services/api';
import { PageHeader } from '../../components/PageBits';
import { StatusChip } from '../../components/StatusChip';

export function CmdbDetail() {
  const { id = '' } = useParams();
  const { data: ci } = useCiQuery(id);
  const { data: impact } = useCiImpactQuery({ id, depth: 3 });
  if (!ci) return null;
  return (
    <>
      <PageHeader title={`${ci.refNo} — ${ci.name}`} action={<StatusChip value={ci.status} />} />
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Attributes</Typography>
            <Typography>Type: {ci.type?.name}</Typography>
            <Typography>Environment: {ci.environment}</Typography>
            <Typography>Criticality: {ci.criticality}</Typography>
            <Typography>Owner: {ci.owner?.email ?? '—'}</Typography>
            <Typography variant="subtitle2" sx={{ mt: 2 }}>Attributes</Typography>
            <pre style={{ background: '#f5f5f5', padding: 8 }}>{ci.attributes}</pre>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card><CardContent>
            <Typography variant="h6">Impact Graph (depth 3)</Typography>
            <Typography variant="caption">Nodes: {impact?.nodes?.length ?? 0} · Edges: {impact?.edges?.length ?? 0}</Typography>
            <Box sx={{ mt: 1, maxHeight: 400, overflow: 'auto' }}>
              {(impact?.nodes ?? []).map((n: any) => (
                <Typography key={n.id} variant="body2">• {n.name} ({n.type})</Typography>
              ))}
            </Box>
          </CardContent></Card>
        </Grid>
      </Grid>
    </>
  );
}
