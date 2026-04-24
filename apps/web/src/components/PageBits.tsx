import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';

export function PageHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
      <Typography variant="h4">{title}</Typography>
      {action}
    </Stack>
  );
}

export function ListGrid({
  rows,
  columns,
  loading,
  linkTo,
}: {
  rows: any[];
  columns: GridColDef[];
  loading?: boolean;
  linkTo?: (row: any) => string;
}) {
  const nav = useNavigate();
  const finalCols: GridColDef[] = linkTo
    ? columns.map((c, i) =>
        i === 0
          ? {
              ...c,
              renderCell: (p: any) =>
                c.renderCell ? (
                  <Link to={linkTo(p.row)} style={{ color: 'inherit' }}>{c.renderCell(p)}</Link>
                ) : (
                  <Link to={linkTo(p.row)} style={{ color: '#1976d2', textDecoration: 'none', fontWeight: 500 }}>
                    {p.formattedValue ?? p.value}
                  </Link>
                ),
            }
          : c,
      )
    : columns;
  return (
    <Box sx={{ height: 'calc(100vh - 220px)', width: '100%' }}>
      <DataGrid
        rows={rows ?? []}
        columns={finalCols}
        loading={loading}
        getRowId={(r) => r.id}
        pageSizeOptions={[25, 50, 100]}
        initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
        onRowClick={linkTo ? (p) => nav(linkTo(p.row)) : undefined}
        sx={linkTo ? { '& .MuiDataGrid-row': { cursor: 'pointer' } } : undefined}
      />
    </Box>
  );
}

export function NewButton({ to, label }: { to: string; label: string }) {
  return <Button component={Link} to={to} variant="contained">{label}</Button>;
}

export function SearchBox({ value, onChange, placeholder = 'Search...' }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return <TextField size="small" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />;
}
