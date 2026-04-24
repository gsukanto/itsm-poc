import React, { useMemo } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { useChangeCalendarQuery } from '../../services/api';
import { PageHeader } from '../../components/PageBits';
import { StatusChip } from '../../components/StatusChip';

export function ChangeCalendar() {
  const { from, to } = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 2, 0);
    return { from: start.toISOString(), to: end.toISOString() };
  }, []);
  const { data = [] } = useChangeCalendarQuery({ from, to });
  return (
    <>
      <PageHeader title="Change Calendar" />
      <Paper sx={{ p: 2 }}>
        {data.length === 0 && <Typography color="text.secondary">No scheduled changes.</Typography>}
        {data.map((c: any) => (
          <Box key={c.id} sx={{ py: 1.5, borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="subtitle1">{c.refNo} — {c.title}</Typography>
              <Typography variant="caption">{new Date(c.startAt).toLocaleString()} → {new Date(c.endAt).toLocaleString()}</Typography>
            </Box>
            <Box><StatusChip value={c.risk} /> <StatusChip value={c.status} /></Box>
          </Box>
        ))}
      </Paper>
    </>
  );
}
