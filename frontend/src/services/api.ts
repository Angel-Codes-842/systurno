import axios from 'axios';
import type { ServiceType, Ticket, Slider, TicketStats, Voice } from '@/types';

const BASE_URL = (import.meta.env.VITE_API_URL as string) ?? '';

const api = axios.create({
  baseURL: BASE_URL,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const data = error?.response?.data as Record<string, unknown> | undefined;
    const message =
      (data?.detail as string) ??
      (data?.error as string) ??
      (error as Error).message;
    return Promise.reject(new Error(message));
  }
);

// --- Tickets ---

export async function generateTicket(serviceType: ServiceType): Promise<Ticket> {
  const response = await api.post<Ticket>('/api/tickets/generate/', {
    service_type: serviceType,
  });
  return response.data;
}

export async function getWaitingTickets(): Promise<Ticket[]> {
  const response = await api.get<Ticket[]>('/api/tickets/waiting/');
  return response.data;
}

export async function getCalledTickets(): Promise<Ticket[]> {
  const response = await api.get<Ticket[]>('/api/tickets/called/');
  return response.data;
}

export async function getAttendedTickets(): Promise<Ticket[]> {
  const response = await api.get<Ticket[]>('/api/tickets/attended/');
  return response.data;
}

export async function callTicket(id: number): Promise<Ticket> {
  const response = await api.post<Ticket>(`/api/tickets/${id}/call/`);
  return response.data;
}

export async function recallTicket(id: number): Promise<Ticket> {
  const response = await api.post<Ticket>(`/api/tickets/${id}/recall/`);
  return response.data;
}

export async function attendTicket(id: number): Promise<Ticket> {
  const response = await api.post<Ticket>(`/api/tickets/${id}/attend/`);
  return response.data;
}

export async function cancelTicket(id: number): Promise<Ticket> {
  const response = await api.post<Ticket>(`/api/tickets/${id}/cancel/`);
  return response.data;
}

export async function getTicketStats(): Promise<TicketStats> {
  const response = await api.get<TicketStats>('/api/tickets/stats/');
  return response.data;
}

// --- Sliders ---

export async function getActiveSliders(): Promise<Slider[]> {
  const response = await api.get<Slider[]>('/api/sliders/active/');
  return response.data;
}

export async function deleteSlider(id: number): Promise<void> {
  await api.delete(`/api/sliders/${id}/`);
}

export async function uploadSlider(formData: FormData): Promise<Slider> {
  const response = await api.post<Slider>('/api/sliders/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export async function updateSlider(id: number, data: Partial<Slider>): Promise<Slider> {
  const response = await api.patch<Slider>(`/api/sliders/${id}/`, data);
  return response.data;
}

// --- TTS ---

export function getTTS(text: string): string {
  const encoded = encodeURIComponent(text);
  return `${BASE_URL}/api/tts/?text=${encoded}`;
}

// --- Voces ---

export async function getVoices(): Promise<Voice[]> {
  const response = await api.get<Voice[]>('/api/voices/');
  return response.data;
}

export async function uploadVoice(formData: FormData): Promise<Voice> {
  const response = await api.post<Voice>('/api/voices/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export async function activateVoice(id: number): Promise<{ status: string }> {
  const response = await api.post<{ status: string }>(`/api/voices/${id}/activate/`);
  return response.data;
}

export async function deleteVoice(id: number): Promise<void> {
  await api.delete(`/api/voices/${id}/`);
}

export function getVoiceTestAudioUrl(id: number, text: string): string {
  const encoded = encodeURIComponent(text);
  return `${BASE_URL}/api/voices/${id}/test_audio/?text=${encoded}`;
}

export async function shutdownServer(): Promise<{ status: string }> {
  const response = await api.post<{ status: string }>('/api/system/shutdown/');
  return response.data;
}

export default api;
