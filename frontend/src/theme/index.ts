import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary:   { main: '#1B2A4A', contrastText: '#fff' },
    secondary: { main: '#2563EB', contrastText: '#fff' },
    success:   { main: '#4ADE80', contrastText: '#fff' },
    background:{ default: '#E8EDF2', paper: '#ffffff' },
    text:      { primary: '#0F172A', secondary: '#475569' },
  },
  typography: {
    fontFamily: '"Inter", system-ui, sans-serif',
    fontWeightBold: 700,
  },
  shape: { borderRadius: 8 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600 },
      },
    },
    MuiCssBaseline: {
      styleOverrides: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
      `,
    },
  },
});
