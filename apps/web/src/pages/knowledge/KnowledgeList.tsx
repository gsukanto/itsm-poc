import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { useCreateKbArticleMutation, useKbArticlesQuery } from '../../services/api';
import { ListGrid, PageHeader } from '../../components/PageBits';
import { ModuleViews } from '../../components/ModuleViews';
import { StatusChip } from '../../components/StatusChip';

export function KnowledgeList() {
  const nav = useNavigate();
  const { data = [], isFetching } = useKbArticlesQuery({});
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', summary: '', body: '' });
  const [create] = useCreateKbArticleMutation();
  const cols: GridColDef[] = [
    { field: 'refNo', headerName: 'Ref', width: 130 },
    { field: 'title', headerName: 'Title', flex: 1, renderCell: (p) => <Link to={`/knowledge/${p.row.id}`}>{p.value}</Link> },
    { field: 'status', headerName: 'Status', width: 130, renderCell: (p) => <StatusChip value={p.value} /> },
    { field: 'updatedAt', headerName: 'Updated', width: 180, valueFormatter: (v) => v ? new Date(v).toLocaleString() : '' },
  ];
  return (
    <>
      <PageHeader title="Knowledge Base" action={<Button variant="contained" onClick={() => setOpen(true)}>New Article</Button>} />
      <ModuleViews module="knowledge" rows={data as any[]} columns={cols} loading={isFetching} linkTo={(r) => `/knowledge/${r.id}`} />
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>New KB Article</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <TextField label="Summary" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
            <TextField label="Body (Markdown)" multiline minRows={8} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={async () => { const r: any = await create(form).unwrap(); setOpen(false); nav(`/knowledge/${r.id}`); }}>Create</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
