import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { useCatalogItemQuery, useCreateServiceRequestMutation } from '../../services/api';
import { PageHeader } from '../../components/PageBits';

export function CatalogRequest() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const { data: item } = useCatalogItemQuery(id);
  const [createSr, { isLoading }] = useCreateServiceRequestMutation();
  const [formData, setFormData] = useState<Record<string, any>>({});

  const fields = useMemo(() => {
    try { return item?.formSchema ? JSON.parse(item.formSchema).fields ?? [] : []; } catch { return []; }
  }, [item]);

  if (!item) return null;
  const submit = async () => {
    const r: any = await createSr({ catalogItemId: id, title: item.name, formData }).unwrap();
    nav(`/service-requests/${r.id}`);
  };
  return (
    <>
      <PageHeader title={`Request: ${item.name}`} />
      <Paper sx={{ p: 3, maxWidth: 720 }}>
        <Typography color="text.secondary" sx={{ mb: 2 }}>{item.description ?? item.shortDescription}</Typography>
        <Stack spacing={2}>
          {fields.length === 0 && (
            <TextField label="Notes / Justification" multiline minRows={3}
              value={formData.notes ?? ''} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
          )}
          {fields.map((f: any) => (
            <TextField key={f.key} label={f.label ?? f.key} required={f.required}
              value={formData[f.key] ?? ''} onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })} />
          ))}
          <Button variant="contained" onClick={submit} disabled={isLoading}>Submit Request</Button>
        </Stack>
      </Paper>
    </>
  );
}
