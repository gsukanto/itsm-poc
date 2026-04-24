import React from 'react';
import { GridColDef } from '@mui/x-data-grid';
import { useSuppliersQuery } from '../../services/api';
import { ListGrid, PageHeader } from '../../components/PageBits';

export function SupplierList() {
  const { data = [], isFetching } = useSuppliersQuery();
  const cols: GridColDef[] = [
    { field: 'name', headerName: 'Name', flex: 1 },
    { field: 'tier', headerName: 'Tier', width: 100 },
    { field: 'contactName', headerName: 'Contact', width: 200 },
    { field: 'contactEmail', headerName: 'Email', width: 240 },
    { field: 'status', headerName: 'Status', width: 130 },
  ];
  return (
    <>
      <PageHeader title="Suppliers" />
      <ListGrid rows={data} columns={cols} loading={isFetching} linkTo={(r) => `/suppliers/${r.id}`} />
    </>
  );
}
