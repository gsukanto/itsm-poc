import React from 'react';
import { Box, Card, CardContent, Grid, Typography } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { useSlaBreachesQuery, useSlasQuery } from '../../services/api';
import { ListGrid, PageHeader } from '../../components/PageBits';
import { StatusChip } from '../../components/StatusChip';

export function SlaList() {
  const { data: slas = [], isFetching } = useSlasQuery();
  const { data: breaches = [] } = useSlaBreachesQuery();
  const cols: GridColDef[] = [
    { field: 'name', headerName: 'Name', flex: 1 },
    { field: 'priority', headerName: 'Priority', width: 100 },
    { field: 'responseMinutes', headerName: 'Response (min)', width: 140 },
    { field: 'resolveMinutes', headerName: 'Resolve (min)', width: 140 },
    { field: 'serviceHours', headerName: 'Service Hours', width: 200, valueGetter: (_v, r) => r?.serviceHours?.name },
  ];
  return (
    <>
      <PageHeader title="Service Level Management" />
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Card><CardContent>
            <Typography variant="overline">SLA Breaches (open)</Typography>
            <Typography variant="h3" color="error.main">{breaches.length}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} md={8}>
          <Card><CardContent>
            <Typography variant="overline">Recent Breaches</Typography>
            {breaches.slice(0, 5).map((b: any) => (
              <Box key={b.id} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                <Typography variant="body2">{b.entityType} {b.entityRef} — {b.target}</Typography>
                <StatusChip value={b.status} />
              </Box>
            ))}
            {breaches.length === 0 && <Typography color="text.secondary">No open breaches.</Typography>}
          </CardContent></Card>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>SLA Definitions</Typography>
          <ListGrid rows={slas} columns={cols} loading={isFetching} linkTo={(r) => `/slm/${r.id}`} />
        </Grid>
      </Grid>
    </>
  );
}
