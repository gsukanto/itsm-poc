import React, { useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { useCreateReleaseMutation, useReleasesQuery } from '../../services/api';
import { ListGrid, PageHeader } from '../../components/PageBits';
import { StatusChip } from '../../components/StatusChip';

export function ReleaseList() {
  const { data = [], isFetching } = useReleasesQuery({});
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', version: '', releaseType: 'minor', description: '' });
  const [create] = useCreateReleaseMutation();
  const cols: GridColDef[] = [
    { field: 'refNo', headerName: 'Ref', width: 130 },
    { field: 'name', headerName: 'Name', flex: 1 },
    { field: 'version', headerName: 'Version', width: 120 },
    { field: 'releaseType', headerName: 'Type', width: 110 },
    { field: 'status', headerName: 'Status', width: 140, renderCell: (p) => <StatusChip value={p.value} /> },
    { field: 'plannedAt', headerName: 'Planned', width: 180, valueFormatter: (v) => v ? new Date(v).toLocaleString() : '' },
  ];
  return (
    <>
      <PageHeader title="Releases" action={<Button variant="contained" onClick={() => setOpen(true)}>New Release</Button>} />
      <ListGrid rows={data} columns={cols} loading={isFetching} linkTo={(r) => `/releases/${r.id}`} />
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>New Release</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <TextField label="Version" value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} />
            <TextField select label="Type" value={form.releaseType} onChange={(e) => setForm({ ...form, releaseType: e.target.value })}>
              {['major','minor','patch','hotfix'].map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </TextField>
            <TextField label="Description" multiline minRows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={async () => { await create(form); setOpen(false); }}>Create</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
