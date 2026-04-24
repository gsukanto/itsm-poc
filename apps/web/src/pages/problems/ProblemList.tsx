import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { useCreateProblemMutation, useProblemsQuery } from '../../services/api';
import { ListGrid, PageHeader } from '../../components/PageBits';
import { StatusChip } from '../../components/StatusChip';

export function ProblemList() {
  const nav = useNavigate();
  const { data = [], isFetching } = useProblemsQuery({});
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', priority: 'P3' });
  const [create] = useCreateProblemMutation();
  const cols: GridColDef[] = [
    { field: 'refNo', headerName: 'Ref', width: 130 },
    { field: 'title', headerName: 'Title', flex: 1 },
    { field: 'priority', headerName: 'Priority', width: 100, renderCell: (p) => <StatusChip value={p.value} /> },
    { field: 'status', headerName: 'Status', width: 140, renderCell: (p) => <StatusChip value={p.value} /> },
    { field: 'createdAt', headerName: 'Created', width: 180, valueFormatter: (v) => v ? new Date(v).toLocaleString() : '' },
  ];
  return (
    <>
      <PageHeader title="Problems" action={<Button variant="contained" onClick={() => setOpen(true)}>New Problem</Button>} />
      <ListGrid rows={data} columns={cols} loading={isFetching} linkTo={(r) => `/problems/${r.id}`} />
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>New Problem</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <TextField label="Description" multiline minRows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <TextField select label="Priority" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              {['P1','P2','P3','P4','P5'].map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={async () => { const r: any = await create(form).unwrap(); setOpen(false); nav(`/problems/${r.id}`); }}>Create</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
