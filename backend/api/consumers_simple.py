import json
from channels.generic.websocket import AsyncWebsocketConsumer


class SimpleConsumer(AsyncWebsocketConsumer):
    """Consumer simple para testing."""
    
    async def connect(self):
        """Aceptar conexión sin channel_layer."""
        await self.accept()
        await self.send(text_data=json.dumps({
            'type': 'connected',
            'message': 'WebSocket conectado correctamente'
        }))
        print("✅ WebSocket conectado")
    
    async def disconnect(self, close_code):
        """Desconectar."""
        print(f"❌ WebSocket desconectado: {close_code}")
    
    async def receive(self, text_data):
        """Recibir y responder."""
        await self.send(text_data=json.dumps({
            'type': 'echo',
            'message': f'Recibido: {text_data}'
        }))
