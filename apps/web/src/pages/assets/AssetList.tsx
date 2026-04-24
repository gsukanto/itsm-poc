import React, { useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { useAssetsQuery, useCreateAssetMutation } from '../../services/api';
import { ListGrid, PageHeader } from '../../components/PageBits';
import { StatusChip } from '../../components/StatusChip';

export function AssetList() {
  const { data = [], isFetching } = useAssetsQuery({});
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: '', assetType: 'hardware', serialNumber: '', status: 'in_stock' });
  const [create] = useCreateAssetMutation();
  const cols: GridColDef[] = [
    { field: 'refNo', headerName: 'Ref', width: 130 },
    { field: 'name', headerName: 'Name', flex: 1 },
    { field: 'assetType', headerName: 'Type', width: 110 },
    { field: 'serialNumber', headerName: 'Serial', width: 180 },
    { field: 'status', headerName: 'Status', width: 140, renderCell: (p) => <StatusChip value={p.value} /> },
    { field: 'assignedToEmail', headerName: 'Assignee', width: 200, valueGetter: (_v, r) => r?.assignedTo?.email },
  ];
  return (
    <>
      <PageHeader title="Assets" action={<Button variant="contained" onClick={() => setOpen(true)}>New Asset</Button>} />
      <ListGrid rows={data} columns={cols} loading={isFetching} linkTo={(r) => `/assets/${r.id}`} />
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>New Asset</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
            <TextField select label="Type" value={f.assetType} onChange={(e) => setF({ ...f, assetType: e.target.value })}>
              {['hardware','software','license','virtual','accessory'].map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </TextField>
            <TextField label="Serial Number" value={f.serialNumber} onChange={(e) => setF({ ...f, serialNumber: e.target.value })} />
            <TextField select label="Status" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
              {['in_stock','assigned','retired','lost','disposed'].map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={async () => { await create(f); setOpen(false); }}>Create</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
