import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { useChangesQuery } from '../../services/api';
import { ListGrid, PageHeader } from '../../components/PageBits';
import { ModuleViews } from '../../components/ModuleViews';
import { StatusChip } from '../../components/StatusChip';

export function ChangeList() {
  const { data, isFetching } = useChangesQuery({ pageSize: 100 });
  const rows = data?.items ?? data ?? [];
  const cols: GridColDef[] = [
    { field: 'refNo', headerName: 'Ref', width: 130 },
    { field: 'title', headerName: 'Title', flex: 1 },
    { field: 'changeType', headerName: 'Type', width: 110 },
    { field: 'risk', headerName: 'Risk', width: 90 },
    { field: 'riskScore', headerName: 'Score', width: 80 },
    { field: 'status', headerName: 'Status', width: 140, renderCell: (p) => <StatusChip value={p.value} /> },
    { field: 'startAt', headerName: 'Start', width: 180, valueFormatter: (v) => v ? new Date(v).toLocaleString() : '' },
  ];
  return (
    <>
      <PageHeader title="Changes" action={<Button component={Link} to="/changes/new" variant="contained">New Change</Button>} />
      <ModuleViews module="change" rows={rows} columns={cols} loading={isFetching} linkTo={(r) => `/changes/${r.id}`} />
    </>
  );
}
