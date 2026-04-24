import React from 'react';
import { Chip } from '@mui/material';

const colorMap: Record<string, any> = {
  open: 'info', new: 'info', in_progress: 'primary', pending: 'warning', on_hold: 'warning',
  resolved: 'success', closed: 'default', cancelled: 'default', rejected: 'error', breached: 'error',
  approved: 'success', completed: 'success', deployed: 'success', published: 'success',
  P1: 'error', P2: 'warning', P3: 'info', P4: 'default', P5: 'default',
  critical: 'error', high: 'warning', medium: 'info', low: 'default',
};

export function StatusChip({ value }: { value?: string | null }) {
  if (!value) return null;
  const c = colorMap[value] ?? colorMap[value.toLowerCase()] ?? 'default';
  return <Chip label={value} color={c} size="small" variant={c === 'default' ? 'outlined' : 'filled'} />;
}
