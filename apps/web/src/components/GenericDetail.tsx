import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { Box, Button, Chip, CircularProgress, Paper, Stack, Table, TableBody, TableCell, TableRow, Typography } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { PageHeader } from './PageBits';

function formatVal(v: any): React.ReactNode {
  if (v == null) return <em style={{ color: '#999' }}>—</em>;
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (typeof v === 'string') {
    if (/^\d{4}-\d{2}-\d{2}T/.test(v)) {
      const d = new Date(v);
      if (!isNaN(d.getTime())) return d.toLocaleString();
    }
    if (v.length > 200) return <Box component="pre" sx={{ whiteSpace: 'pre-wrap', m: 0, fontFamily: 'inherit' }}>{v}</Box>;
    return v;
  }
  if (Array.isArray(v)) {
    if (v.length === 0) return <em style={{ color: '#999' }}>(empty)</em>;
    return <Stack spacing={0.5}>{v.map((it, i) => <Box key={i}>{typeof it === 'object' ? JSON.stringify(it) : String(it)}</Box>)}</Stack>;
  }
  if (typeof v === 'object') {
    return <Box component="pre" sx={{ whiteSpace: 'pre-wrap', m: 0, fontFamily: 'monospace', fontSize: 12 }}>{JSON.stringify(v, null, 2)}</Box>;
  }
  return String(v);
}

const HIDDEN_KEYS = new Set(['id']);

export function DetailView({
  title,
  data,
  loading,
  backTo,
  highlight,
  extra,
}: {
  title: string;
  data: any;
  loading?: boolean;
  backTo: string;
  highlight?: string[]; // keys to render as chips at top
  extra?: React.ReactNode;
}) {
  if (loading) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;
  if (!data) return <Box sx={{ p: 4 }}><Typography>Not found.</Typography><Button component={Link} to={backTo} startIcon={<ArrowBack />}>Back</Button></Box>;
  const entries = Object.entries(data).filter(([k]) => !HIDDEN_KEYS.has(k));
  return (
    <>
      <PageHeader
        title={title}
        action={<Button component={Link} to={backTo} startIcon={<ArrowBack />}>Back</Button>}
      />
      {highlight && highlight.length > 0 && (
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          {highlight.map((k) => data[k] != null && <Chip key={k} label={`${k}: ${data[k]}`} />)}
        </Stack>
      )}
      <Paper sx={{ p: 2 }}>
        <Table size="small">
          <TableBody>
            {entries.map(([k, v]) => (
              <TableRow key={k}>
                <TableCell sx={{ width: 220, fontWeight: 500, verticalAlign: 'top', color: 'text.secondary' }}>{k}</TableCell>
                <TableCell>{formatVal(v)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
      {extra && <Box sx={{ mt: 2 }}>{extra}</Box>}
    </>
  );
}

// Generic component when you only have a list endpoint: finds item by id from a list
export function ListItemDetail({
  title,
  items,
  loading,
  backTo,
  highlight,
}: {
  title: string;
  items: any[] | undefined;
  loading?: boolean;
  backTo: string;
  highlight?: string[];
}) {
  const { id } = useParams();
  const data = (items ?? []).find((x) => x.id === id);
  return <DetailView title={title} data={data} loading={loading} backTo={backTo} highlight={highlight} />;
}
