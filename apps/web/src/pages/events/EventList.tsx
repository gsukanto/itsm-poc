import React from 'react';
import { GridColDef } from '@mui/x-data-grid';
import { useEventsQuery } from '../../services/api';
import { ListGrid, PageHeader } from '../../components/PageBits';
import { ModuleViews } from '../../components/ModuleViews';
import { StatusChip } from '../../components/StatusChip';

export function EventList() {
  const { data = [], isFetching } = useEventsQuery({});
  const cols: GridColDef[] = [
    { field: 'createdAt', headerName: 'Time', width: 180, valueFormatter: (v) => v ? new Date(v).toLocaleString() : '' },
    { field: 'severity', headerName: 'Severity', width: 110, renderCell: (p) => <StatusChip value={p.value} /> },
    { field: 'source', headerName: 'Source', width: 160, valueGetter: (_v, r) => r?.source?.name },
    { field: 'message', headerName: 'Message', flex: 1 },
    { field: 'status', headerName: 'Status', width: 130, renderCell: (p) => <StatusChip value={p.value} /> },
    { field: 'incidentRef', headerName: 'Incident', width: 140, valueGetter: (_v, r) => r?.incident?.refNo },
  ];
  return (
    <>
      <PageHeader title="Events" />
      <ModuleViews module="event" rows={data as any[]} columns={cols} loading={isFetching} linkTo={(r) => `/events/${r.id}`} />
    </>
  );
}
