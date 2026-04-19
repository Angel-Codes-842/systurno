import json
from channels.generic.websocket import AsyncWebsocketConsumer


class CheckinConsumer(AsyncWebsocketConsumer):
    """
    Consumer de WebSocket para notificaciones de turnos en tiempo real.
    """
    
    async def connect(self):
        """Conectar al WebSocket y unirse al grupo."""
        await self.channel_layer.group_add("checkins", self.channel_name)
        await self.accept()
        
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'Conectado al sistema de turnos'
        }))
    
    async def disconnect(self, close_code):
        """Desconectar del WebSocket."""
        await self.channel_layer.group_discard("checkins", self.channel_name)
    
    async def receive(self, text_data):
        """Recibir mensaje del cliente."""
        try:
            data = json.loads(text_data)
            action = data.get('action')
            
            if action == 'subscribe_display':
                await self.channel_layer.group_add("display", self.channel_name)
                await self.send(text_data=json.dumps({
                    'type': 'subscribed',
                    'group': 'display'
                }))
        except json.JSONDecodeError:
            pass
    
    async def ticket_called(self, event):
        """Ticket llamado - enviar a clientes."""
        await self.send(text_data=json.dumps({
            'type': 'ticket_called',
            'ticket': event['ticket'],
        }))
    
    async def new_ticket(self, event):
        """Nuevo ticket generado - enviar a clientes."""
        await self.send(text_data=json.dumps({
            'type': 'new_ticket',
            'ticket': event['ticket'],
        }))
    
    async def new_checkin(self, event):
        """Nuevo check-in registrado."""
        await self.send(text_data=json.dumps({
            'type': 'new_checkin',
            'checkin': event['checkin']
        }))
    
    async def call_patient(self, event):
        """Paciente llamado."""
        await self.send(text_data=json.dumps({
            'type': 'call_patient',
            'checkin': event['checkin']
        }))
    
    async def update_status(self, event):
        """Estado actualizado."""
        await self.send(text_data=json.dumps({
            'type': 'update_status',
            'checkin': event['checkin']
        }))
    
    async def slider_update(self, event):
        """Sliders actualizados - notificar para recargar."""
        await self.send(text_data=json.dumps({
            'type': 'slider_update',
        }))


class DisplayConsumer(AsyncWebsocketConsumer):
    """Consumer para la pantalla de sala de espera."""
    
    async def connect(self):
        await self.channel_layer.group_add("display", self.channel_name)
        await self.accept()
    
    async def disconnect(self, close_code):
        await self.channel_layer.group_discard("display", self.channel_name)
    
    async def ticket_called(self, event):
        """Ticket llamado."""
        await self.send(text_data=json.dumps({
            'type': 'ticket_called',
            'ticket': event['ticket'],
        }))
    
    async def call_patient(self, event):
        """Paciente llamado."""
        await self.send(text_data=json.dumps({
            'type': 'call_patient',
            'checkin': event['checkin']
        }))

    async def slider_update(self, event):
        """Sliders actualizados - notificar para recargar."""
        await self.send(text_data=json.dumps({
            'type': 'slider_update',
        }))
