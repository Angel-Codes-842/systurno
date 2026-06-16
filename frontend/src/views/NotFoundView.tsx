import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export function NotFoundView() {
  const nav = useNavigate();
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 2 }}>
      <Typography variant="h2" fontWeight={800} color="primary">404</Typography>
      <Typography color="text.secondary">Página no encontrada</Typography>
      <Button variant="contained" onClick={() => nav('/')}>Volver</Button>
    </Box>
  );
}
