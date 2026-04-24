import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Card, CardActionArea, CardContent, Grid, Typography } from '@mui/material';
import { useCapacityPlansQuery } from '../../services/api';
import { PageHeader } from '../../components/PageBits';

export function CapacityList() {
  const { data: plans = [] } = useCapacityPlansQuery();
  return (
    <>
      <PageHeader title="Capacity Management" />
      <Grid container spacing={2}>
        {plans.map((p: any) => (
          <Grid item xs={12} md={6} lg={4} key={p.id}>
            <Card>
              <CardActionArea component={RouterLink} to={`/capacity/${p.id}`}>
                <CardContent>
                  <Typography variant="h6">{p.name}</Typography>
                  <Typography variant="caption" color="text.secondary">Service: {p.serviceKey}</Typography>
                  <Typography sx={{ mt: 1 }}>{p.notes}</Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
        {plans.length === 0 && <Grid item xs={12}><Typography color="text.secondary">No capacity plans.</Typography></Grid>}
      </Grid>
    </>
  );
}
