import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Card, CardActionArea, CardContent, Grid, Stack, Typography, Chip } from '@mui/material';
import { useWorkflowsQuery } from '../../services/api';
import { PageHeader } from '../../components/PageBits';

export function WorkflowList() {
  const { data = [], isFetching } = useWorkflowsQuery();
  return (
    <>
      <PageHeader title="Workflows" />
      {isFetching && <Typography>Loading…</Typography>}
      <Grid container spacing={2}>
        {(data as any[]).map((w) => (
          <Grid item xs={12} sm={6} md={4} key={w.module}>
            <Card variant="outlined">
              <CardActionArea component={RouterLink} to={`/admin/workflows/${w.module}`}>
                <CardContent>
                  <Typography variant="h6">{w.name}</Typography>
                  <Typography variant="caption" color="text.secondary">module: {w.module}</Typography>
                  <Stack direction="row" spacing={0.5} sx={{ mt: 1, flexWrap: 'wrap', rowGap: 0.5 }}>
                    {w.states.map((s: any) => (
                      <Chip
                        key={s.id}
                        size="small"
                        label={s.label}
                        sx={{ bgcolor: s.color, color: '#fff' }}
                        variant={s.isTerminal ? 'filled' : 'outlined'}
                      />
                    ))}
                  </Stack>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    {w.states.length} states · {w.transitions.length} transitions
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </>
  );
}
