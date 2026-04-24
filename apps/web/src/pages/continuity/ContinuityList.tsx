import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Card, CardActionArea, CardContent, Grid, Typography } from '@mui/material';
import { useContinuityPlansQuery } from '../../services/api';
import { PageHeader } from '../../components/PageBits';

export function ContinuityList() {
  const { data: plans = [] } = useContinuityPlansQuery();
  return (
    <>
      <PageHeader title="Service Continuity" />
      <Grid container spacing={2}>
        {plans.map((p: any) => (
          <Grid item xs={12} md={6} key={p.id}>
            <Card>
              <CardActionArea component={RouterLink} to={`/continuity/${p.id}`}>
                <CardContent>
                  <Typography variant="h6">{p.name}</Typography>
                  <Typography>RTO: {p.rtoMinutes ?? '—'} min · RPO: {p.rpoMinutes ?? '—'} min</Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>{p.strategy}</Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
        {plans.length === 0 && <Grid item xs={12}><Typography color="text.secondary">No continuity plans.</Typography></Grid>}
      </Grid>
    </>
  );
}
