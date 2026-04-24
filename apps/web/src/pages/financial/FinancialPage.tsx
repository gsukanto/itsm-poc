import React, { useState } from 'react';
import { Box, Card, CardContent, Grid, MenuItem, TextField, Typography } from '@mui/material';
import { useChargebackQuery, useCostCentersQuery } from '../../services/api';
import { PageHeader } from '../../components/PageBits';

export function FinancialPage() {
  const [fy, setFy] = useState(String(new Date().getFullYear()));
  const { data: cc = [] } = useCostCentersQuery();
  const { data: chargeback = [] } = useChargebackQuery(fy);
  return (
    <>
      <PageHeader title="Service Financial Management" />
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Card><CardContent>
            <Typography variant="h6">Cost Centers</Typography>
            {cc.map((c: any) => (
              <Box key={c.id} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography>{c.code} — {c.name}</Typography>
                <Typography>{c.owner?.email}</Typography>
              </Box>
            ))}
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} md={8}>
          <Card><CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Chargeback Report</Typography>
              <TextField select size="small" label="FY" value={fy} onChange={(e) => setFy(e.target.value)}>
                {[...Array(5)].map((_, i) => { const y = String(new Date().getFullYear() - i); return <MenuItem key={y} value={y}>{y}</MenuItem>; })}
              </TextField>
            </Box>
            {chargeback.map((row: any) => (
              <Box key={row.costCenterId} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                <Typography>{row.costCenterCode} — {row.costCenterName}</Typography>
                <Typography>{row.totalAmount?.toFixed?.(2) ?? row.totalAmount}</Typography>
              </Box>
            ))}
            {chargeback.length === 0 && <Typography color="text.secondary">No charges in FY{fy}.</Typography>}
          </CardContent></Card>
        </Grid>
      </Grid>
    </>
  );
}
