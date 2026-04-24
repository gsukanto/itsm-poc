import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Box, Card, CardActionArea, CardContent, Grid, TextField, Typography } from '@mui/material';
import { useCatalogItemsQuery } from '../../services/api';
import { PageHeader } from '../../components/PageBits';

export function CatalogBrowse() {
  const [q, setQ] = useState('');
  const { data: items = [] } = useCatalogItemsQuery({ q: q || undefined });
  return (
    <>
      <PageHeader title="Service Catalog" />
      <TextField placeholder="Search..." size="small" value={q} onChange={(e) => setQ(e.target.value)} sx={{ mb: 2 }} />
      <Grid container spacing={2}>
        {items.map((it: any) => (
          <Grid item xs={12} sm={6} md={4} key={it.id}>
            <Card>
              <CardActionArea component={Link} to={`/catalog/${it.id}`}>
                <CardContent>
                  <Typography variant="h6">{it.name}</Typography>
                  <Typography variant="body2" color="text.secondary">{it.shortDescription}</Typography>
                  <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                    {it.category?.name ?? 'General'} · SLA: {it.slaTier ?? '—'}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
        {items.length === 0 && <Box sx={{ p: 4 }}><Typography color="text.secondary">No catalog items found.</Typography></Box>}
      </Grid>
    </>
  );
}
