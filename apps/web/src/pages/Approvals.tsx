import React from 'react';
import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import { useDecideApprovalMutation, useMyApprovalsQuery } from '../services/api';
import { PageHeader } from '../components/PageBits';
import { StatusChip } from '../components/StatusChip';

export function Approvals() {
  const { data = [] } = useMyApprovalsQuery();
  const [decide] = useDecideApprovalMutation();
  return (
    <>
      <PageHeader title="My Approvals" />
      {data.length === 0 && <Typography color="text.secondary">No pending approvals.</Typography>}
      {data.map((a: any) => (
        <Paper key={a.id} sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="subtitle1">{a.entityType} {a.entityRef}</Typography>
              <Typography variant="caption" color="text.secondary">Step {a.stepIndex} · Requested {new Date(a.createdAt).toLocaleString()}</Typography>
              <Typography sx={{ mt: 1 }}>{a.subject ?? a.title}</Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <StatusChip value={a.decision ?? 'pending'} />
              <Button color="success" variant="contained" onClick={() => decide({ id: a.id, decision: 'approved' })}>Approve</Button>
              <Button color="error" variant="outlined" onClick={() => decide({ id: a.id, decision: 'rejected' })}>Reject</Button>
            </Stack>
          </Box>
        </Paper>
      ))}
    </>
  );
}
