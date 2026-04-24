import React from 'react';
import { Box, Card, CardContent, Grid, Typography } from '@mui/material';
import { useOverviewQuery, useIncidentsByPriorityQuery, useChangesByStatusQuery } from '../services/api';

const Stat = ({ label, value, color = 'primary.main' }: { label: string; value: number | string; color?: string }) => (
  <Card><CardContent>
    <Typography variant="overline" color="text.secondary">{label}</Typography>
    <Typography variant="h4" sx={{ color }}>{value}</Typography>
  </CardContent></Card>
);

export function Dashboard() {
  const { data: o } = useOverviewQuery();
  const { data: byPri = [] } = useIncidentsByPriorityQuery();
  const { data: byStatus = [] } = useChangesByStatusQuery();
  return (
    <Box>
      <Typography variant="h4" gutterBottom>Operations Overview</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}><Stat label="Open Incidents" value={o?.openIncidents ?? '—'} /></Grid>
        <Grid item xs={12} sm={6} md={3}><Stat label="P1 Incidents" value={o?.criticalIncidents ?? '—'} color="error.main" /></Grid>
        <Grid item xs={12} sm={6} md={3}><Stat label="Open SRs" value={o?.openSrs ?? '—'} /></Grid>
        <Grid item xs={12} sm={6} md={3}><Stat label="Pending Approvals" value={o?.pendingApprovals ?? '—'} color="warning.main" /></Grid>
        <Grid item xs={12} sm={6} md={3}><Stat label="Open Changes" value={o?.openChanges ?? '—'} /></Grid>
        <Grid item xs={12} sm={6} md={3}><Stat label="Open Problems" value={o?.openProblems ?? '—'} /></Grid>
        <Grid item xs={12} sm={6} md={3}><Stat label="SLA Breaches" value={o?.breachedSlas ?? '—'} color="error.main" /></Grid>
        <Grid item xs={12} sm={6} md={3}><Stat label="Open Events" value={o?.openEvents ?? '—'} color="warning.main" /></Grid>
        <Grid item xs={12} md={6}>
          <Card><CardContent>
            <Typography variant="h6">Open Incidents by Priority</Typography>
            {byPri.map((b: any) => (
              <Box key={b.priority} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                <Typography>{b.priority}</Typography><Typography>{b.count}</Typography>
              </Box>
            ))}
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card><CardContent>
            <Typography variant="h6">Changes by Status</Typography>
            {byStatus.map((b: any) => (
              <Box key={b.status} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                <Typography>{b.status}</Typography><Typography>{b.count}</Typography>
              </Box>
            ))}
          </CardContent></Card>
        </Grid>
      </Grid>
    </Box>
  );
}
