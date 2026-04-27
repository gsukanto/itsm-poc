import React from 'react';
import { Link } from 'react-router-dom';
import { GridColDef } from '@mui/x-data-grid';
import { useServiceRequestsQuery } from '../../services/api';
import { ListGrid, PageHeader } from '../../components/PageBits';
import { ModuleViews } from '../../components/ModuleViews';
import { StatusChip } from '../../components/StatusChip';
import { Button } from '@mui/material';

export function ServiceRequestList() {
  const { data, isFetching } = useServiceRequestsQuery({ pageSize: 100 });
  const rows = data?.items ?? data ?? [];
  const cols: GridColDef[] = [
    { field: 'refNo', headerName: 'Ref', width: 130 },
    { field: 'title', headerName: 'Title', flex: 1 },
    { field: 'status', headerName: 'Status', width: 140, renderCell: (p) => <StatusChip value={p.value} /> },
    { field: 'requesterEmail', headerName: 'Requester', width: 200, valueGetter: (_v, r) => r?.requester?.email },
    { field: 'createdAt', headerName: 'Created', width: 180, valueFormatter: (v) => v ? new Date(v).toLocaleString() : '' },
  ];
  return (
    <>
      <PageHeader title="Service Requests" action={<Button component={Link} to="/catalog" variant="contained">Browse Catalog</Button>} />
      <ModuleViews module="service_request" rows={rows} columns={cols} loading={isFetching} linkTo={(r) => `/service-requests/${r.id}`} />
    </>
  );
}
