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
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Poppins:wght@400;500;600;700;800;900&display=swap');
        
        @font-face {
          font-family: 'GoodTimeGrotesk';
          src: url('/fonts/MADE GoodTime Grotesk PERSONAL USE.otf') format('opentype');
          font-weight: normal;
          font-style: normal;
        }
        
        * { box-sizing: border-box; }
        body { margin: 0; }
        
        /* Evitar que los navegadores detecten o muestren controles sobre los videos de fondo */
        video {
          pointer-events: none !important;
          -webkit-user-select: none !important;
          -moz-user-select: none !important;
          -ms-user-select: none !important;
          user-select: none !important;
          -webkit-touch-callout: none !important;
        }
        video::-webkit-media-controls {
          display: none !important;
        }
        video::-webkit-media-controls-panel {
          display: none !important;
        }
        video::-webkit-media-controls-panel-container {
          display: none !important;
        }
        video::-webkit-media-controls-start-playback-button {
          display: none !important;
        }
      `,
    },
  },
});
