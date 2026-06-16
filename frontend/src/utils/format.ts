import type { ServiceType, TicketStatus } from '@/types';

const SERVICE_PREFIX: Record<ServiceType, string> = {
  RESULTS: 'R',
  ANALYSIS: 'A',
  BUDGET: 'P',
};

export function getServicePrefix(serviceType: ServiceType): string {
  return SERVICE_PREFIX[serviceType];
}

export function getServiceTypeLabel(serviceType: ServiceType): string {
  switch (serviceType) {
    case 'RESULTS':
      return 'Retirar Resultados';
    case 'ANALYSIS':
      return 'Realizar Análisis';
    case 'BUDGET':
      return 'Solicitar Presupuesto';
    default:
      return serviceType;
  }
}

export function getTicketStatusLabel(status: TicketStatus): string {
  switch (status) {
    case 'WAITING':
      return 'En espera';
    case 'CALLED':
      return 'Llamado';
    case 'ATTENDED':
      return 'Atendido';
    case 'CANCELED':
      return 'Cancelado';
    default:
      return status;
  }
}

export function formatTime(date: Date, format: 'HH:MM' | 'HH:MM:SS' = 'HH:MM'): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  if (format === 'HH:MM:SS') {
    return `${hours}:${minutes}:${seconds}`;
  }

  return `${hours}:${minutes}`;
}
