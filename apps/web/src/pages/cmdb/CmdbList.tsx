import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { useCisQuery, useCiTypesQuery, useCreateCiMutation } from '../../services/api';
import { ListGrid, PageHeader } from '../../components/PageBits';
import { StatusChip } from '../../components/StatusChip';

export function CmdbList() {
  const { data: cis = [], isFetching } = useCisQuery({});
  const { data: types = [] } = useCiTypesQuery();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', typeId: '', environment: 'prod', criticality: 'medium' });
  const [create] = useCreateCiMutation();
  const cols: GridColDef[] = [
    { field: 'refNo', headerName: 'Ref', width: 130 },
    { field: 'name', headerName: 'Name', flex: 1, renderCell: (p) => <Link to={`/cmdb/${p.row.id}`}>{p.value}</Link> },
    { field: 'type', headerName: 'Type', width: 160, valueGetter: (_v, r) => r?.type?.name },
    { field: 'environment', headerName: 'Env', width: 100 },
    { field: 'status', headerName: 'Status', width: 130, renderCell: (p) => <StatusChip value={p.value} /> },
    { field: 'criticality', headerName: 'Criticality', width: 110 },
  ];
  return (
    <>
      <PageHeader title="CMDB — Configuration Items" action={<Button variant="contained" onClick={() => setOpen(true)}>New CI</Button>} />
      <ListGrid rows={cis} columns={cols} loading={isFetching} linkTo={(r) => `/cmdb/${r.id}`} />
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>New CI</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <TextField select label="Type" value={form.typeId} onChange={(e) => setForm({ ...form, typeId: e.target.value })}>
              {types.map((t: any) => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
            </TextField>
            <TextField select label="Environment" value={form.environment} onChange={(e) => setForm({ ...form, environment: e.target.value })}>
              {['dev','test','staging','prod'].map((e) => <MenuItem key={e} value={e}>{e}</MenuItem>)}
            </TextField>
            <TextField select label="Criticality" value={form.criticality} onChange={(e) => setForm({ ...form, criticality: e.target.value })}>
              {['low','medium','high','critical'].map((e) => <MenuItem key={e} value={e}>{e}</MenuItem>)}
            </TextField>
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
