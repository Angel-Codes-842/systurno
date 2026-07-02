export type ServiceType = 'RESULTS' | 'ANALYSIS' | 'BUDGET';
export type TicketStatus = 'WAITING' | 'CALLED' | 'ATTENDED' | 'CANCELED';

export interface Ticket {
  id: number;
  ticket_number: string;
  status: TicketStatus;
  service_type: ServiceType;
  created_at: string;
  called_at: string | null;
  attended_at: string | null;
  status_display: string;
  service_type_display: string;
}

export interface Slider {
  id: number;
  title: string;
  media_type: 'IMAGE' | 'VIDEO';
  image_url: string | null;
  video_url: string | null;
  duration: number;
  order: number;
  is_active: boolean;
  has_sound: boolean;
}

export interface TicketStats {
  total: number;
  waiting: number;
  called: number;
  attended: number;
  canceled: number;
}

export interface Voice {
  id: number;
  name: string;
  onnx_file: string;
  onnx_url: string | null;
  json_file: string;
  json_url: string | null;
  is_active: boolean;
  created_at: string;
}

