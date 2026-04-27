import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stack, MenuItem, TextField } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { useIncidentsQuery } from '../../services/api';
import { ListGrid, NewButton, PageHeader, SearchBox } from '../../components/PageBits';
import { ModuleViews } from '../../components/ModuleViews';
import { StatusChip } from '../../components/StatusChip';

export function IncidentList() {
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const { data, isFetching } = useIncidentsQuery({ q: q || undefined, status: status || undefined, priority: priority || undefined, pageSize: 100 });
  const rows = data?.items ?? data ?? [];
  const cols: GridColDef[] = [
    { field: 'refNo', headerName: 'Ref', width: 130 },
    { field: 'title', headerName: 'Title', flex: 1, minWidth: 240 },
    { field: 'priority', headerName: 'Priority', width: 100, renderCell: (p) => <StatusChip value={p.value} /> },
    { field: 'status', headerName: 'Status', width: 130, renderCell: (p) => <StatusChip value={p.value} /> },
    { field: 'requesterEmail', headerName: 'Requester', width: 180, valueGetter: (_v, row) => row?.requester?.email },
    { field: 'createdAt', headerName: 'Created', width: 180, valueFormatter: (v) => v ? new Date(v).toLocaleString() : '' },
    { field: 'slaDueAt', headerName: 'SLA Due', width: 180, valueFormatter: (v) => v ? new Date(v).toLocaleString() : '' },
  ];
  return (
    <>
      <PageHeader title="Incidents" action={<NewButton to="/incidents/new" label="New Incident" />} />
      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        <SearchBox value={q} onChange={setQ} />
        <TextField select size="small" label="Status" value={status} onChange={(e) => setStatus(e.target.value)} sx={{ width: 160 }}>
          <MenuItem value="">All</MenuItem>
          {['new','in_progress','on_hold','resolved','closed','cancelled'].map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
        </TextField>
        <TextField select size="small" label="Priority" value={priority} onChange={(e) => setPriority(e.target.value)} sx={{ width: 140 }}>
          <MenuItem value="">All</MenuItem>
          {['P1','P2','P3','P4','P5'].map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
        </TextField>
      </Stack>
      <ModuleViews module="incident" rows={rows} columns={cols} loading={isFetching} linkTo={(r) => `/incidents/${r.id}`} />
    </>
  );
}
