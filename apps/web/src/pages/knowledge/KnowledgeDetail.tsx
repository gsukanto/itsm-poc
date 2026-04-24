import React from 'react';
import { useParams } from 'react-router-dom';
import { Button, Paper, Stack, Typography } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import { useKbArticleQuery, usePublishKbArticleMutation } from '../../services/api';
import { PageHeader } from '../../components/PageBits';
import { StatusChip } from '../../components/StatusChip';

export function KnowledgeDetail() {
  const { id = '' } = useParams();
  const { data: a } = useKbArticleQuery(id);
  const [publish] = usePublishKbArticleMutation();
  if (!a) return null;
  return (
    <>
      <PageHeader title={`${a.refNo} — ${a.title}`} action={
        <Stack direction="row" spacing={1}>
          <StatusChip value={a.status} />
          {a.status !== 'published' && <Button variant="contained" onClick={() => publish(id)}>Publish</Button>}
        </Stack>
      } />
      <Paper sx={{ p: 3 }}>
        {a.summary && <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2 }}>{a.summary}</Typography>}
        <ReactMarkdown>{a.body ?? a.currentVersion?.body ?? ''}</ReactMarkdown>
      </Paper>
    </>
  );
}
