import React, { useState } from 'react';
import { Box, Button, Card, CardContent, TextField, Typography } from '@mui/material';
import { isUsingMsal, ensureLogin } from '../auth';

export function LoginPage() {
  const [token, setToken] = useState('');
  if (isUsingMsal) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h5">Redirecting to Microsoft Entra ID...</Typography>
        <Button onClick={() => ensureLogin()} sx={{ mt: 2 }}>Sign in</Button>
      </Box>
    );
  }
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
      <Card sx={{ maxWidth: 480 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>Dev sign in</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Paste a dev JWT signed with <code>JWT_DEV_SECRET</code> from the API .env (HS256, with <code>oid</code>, <code>email</code>).
          </Typography>
          <TextField fullWidth multiline minRows={3} value={token} onChange={(e) => setToken(e.target.value)} placeholder="Bearer token" />
          <Button fullWidth variant="contained" sx={{ mt: 2 }}
            onClick={() => { localStorage.setItem('dev_jwt', token.replace(/[\r\n\s]+/g, '')); window.location.href = '/'; }}>Sign in</Button>
        </CardContent>
      </Card>
    </Box>
  );
}
