import type { ServiceType } from '@/types';

export const SERVICES_CONFIG: Record<ServiceType, { label: string; bg: string; num: string; border: string }> = {
  ANALYSIS: { label: 'Análisis',    bg: '#EDE9FE', num: '#4C1D95', border: '#7C3AED' },
  RESULTS:  { label: 'Resultados',  bg: '#DCFCE7', num: '#14532D', border: '#16A34A' },
  BUDGET:   { label: 'Presupuesto', bg: '#FEF3C7', num: '#78350F', border: '#D97706' },
};
