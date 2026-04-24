import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Card, CardActionArea, CardContent, Grid, Typography } from '@mui/material';
import { useAvailabilityPlansQuery, useOutagesQuery } from '../../services/api';
import { PageHeader } from '../../components/PageBits';
import { StatusChip } from '../../components/StatusChip';

export function AvailabilityList() {
  const { data: plans = [] } = useAvailabilityPlansQuery();
  const { data: outages = [] } = useOutagesQuery();
  return (
    <>
      <PageHeader title="Availability Management" />
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Typography variant="h6" sx={{ mb: 1 }}>Availability Plans</Typography>
          <Grid container spacing={1}>
            {plans.map((p: any) => (
              <Grid item xs={12} key={p.id}>
                <Card>
                  <CardActionArea component={RouterLink} to={`/availability/${p.id}`}>
                    <CardContent>
                      <Typography fontWeight={600}>{p.name ?? p.serviceKey}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Service: {p.serviceKey} · Target {p.targetPct ?? p.targetAvailability}%
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="h6" sx={{ mb: 1 }}>Outages</Typography>
          {outages.map((o: any) => (
            <Card key={o.id} sx={{ mb: 1 }}>
              <CardContent>
                <Typography>{o.serviceKey ?? o.ciId} — {new Date(o.startedAt).toLocaleString()}</Typography>
                <StatusChip value={o.type ?? o.status} />
              </CardContent>
            </Card>
          ))}
        </Grid>
      </Grid>
    </>
  );
}
