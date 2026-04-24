import React from 'react';
import { useParams } from 'react-router-dom';
import { Box, Button, Card, CardContent, Grid, Paper, Typography } from '@mui/material';
import { useServiceRequestQuery, useCompleteFulfilmentTaskMutation } from '../../services/api';
import { PageHeader } from '../../components/PageBits';
import { StatusChip } from '../../components/StatusChip';

export function ServiceRequestDetail() {
  const { id = '' } = useParams();
  const { data: sr } = useServiceRequestQuery(id);
  const [complete] = useCompleteFulfilmentTaskMutation();
  if (!sr) return null;
  return (
    <>
      <PageHeader title={`${sr.refNo} — ${sr.title}`} action={<StatusChip value={sr.status} />} />
      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">Catalog Item</Typography>
            <Typography>{sr.catalogItem?.name}</Typography>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>Form Data</Typography>
            <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 4 }}>{sr.formData}</pre>
          </Paper>
          <Card sx={{ mt: 2 }}><CardContent>
            <Typography variant="h6">Fulfilment Tasks</Typography>
            {(sr.fulfilmentTasks ?? []).map((t: any) => (
              <Box key={t.id} sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #eee' }}>
                <Box>
                  <Typography>{t.title}</Typography>
                  <Typography variant="caption">{t.description}</Typography>
                </Box>
                <Box>
                  <StatusChip value={t.status} />
                  {t.status !== 'completed' && (
                    <Button size="small" sx={{ ml: 1 }} onClick={() => complete(t.id)}>Complete</Button>
                  )}
                </Box>
              </Box>
            ))}
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card><CardContent>
            <Typography variant="subtitle2" color="text.secondary">Requester</Typography>
            <Typography>{sr.requester?.email}</Typography>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>Created</Typography>
            <Typography>{new Date(sr.createdAt).toLocaleString()}</Typography>
          </CardContent></Card>
          <Card sx={{ mt: 2 }}><CardContent>
            <Typography variant="h6">Approvals</Typography>
            {(sr.approvals ?? []).map((a: any) => (
              <Box key={a.id} sx={{ py: 1 }}>
                <Typography variant="body2">{a.approver?.email} — <StatusChip value={a.decision ?? 'pending'} /></Typography>
              </Box>
            ))}
          </CardContent></Card>
        </Grid>
      </Grid>
    </>
  );
}
