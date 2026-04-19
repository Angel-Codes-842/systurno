from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .serializers import CheckinListSerializer


def send_websocket_notification(event_type: str, checkin, groups: list = None):
    """
    Envía una notificación via WebSocket a los grupos especificados.
    
    Args:
        event_type: Tipo de evento ('new_checkin', 'call_patient', 'update_status')
        checkin: Instancia del modelo Checkin
        groups: Lista de grupos a notificar. Si es None, se notifica a todos los grupos relevantes.
    """
    channel_layer = get_channel_layer()
    
    if channel_layer is None:
        # Channels no configurado (probablemente en tests)
        return
    
    # Serializar el checkin
    serializer = CheckinListSerializer(checkin)
    checkin_data = serializer.data
    
    # Determinar grupos a notificar
    if groups is None:
        groups = [
            "checkins",  # Grupo general
            f"specialist_{checkin.specialist_id}",  # Grupo del especialista
        ]
        
        # Para llamados de pacientes, también notificar a la pantalla
        if event_type == 'call_patient':
            groups.append("display")
    
    # Enviar a cada grupo
    for group in groups:
        async_to_sync(channel_layer.group_send)(
            group,
            {
                'type': event_type.replace('-', '_'),  # Convertir a formato de método
                'checkin': checkin_data
            }
        )


def notify_new_checkin(checkin):
    """Notifica que se creó un nuevo check-in."""
    send_websocket_notification('new_checkin', checkin)


def notify_call_patient(checkin):
    """Notifica que un paciente fue llamado."""
    send_websocket_notification('call_patient', checkin)


def notify_status_update(checkin):
    """Notifica que el estado de un check-in cambió."""
    send_websocket_notification('update_status', checkin)


def notify_ticket_called(ticket):
    """
    Notifica que un ticket fue llamado (sistema simple).
    """
    channel_layer = get_channel_layer()
    
    if channel_layer is None:
        return
    
    ticket_data = {
        'id': ticket.id,
        'ticket_number': ticket.ticket_number,
        'status': ticket.status,
        'created_at': ticket.created_at.isoformat() if ticket.created_at else None,
        'called_at': ticket.called_at.isoformat() if ticket.called_at else None,
    }
    
    # Notificar a grupos relevantes
    groups = ['checkins', 'display', 'tickets']
    
    for group in groups:
        async_to_sync(channel_layer.group_send)(
            group,
            {
                'type': 'ticket_called',
                'ticket': ticket_data,
            }
        )


def notify_new_ticket(ticket):
    """
    Notifica que se generó un nuevo ticket.
    """
    channel_layer = get_channel_layer()
    
    if channel_layer is None:
        return
    
    ticket_data = {
        'id': ticket.id,
        'ticket_number': ticket.ticket_number,
        'status': ticket.status,
        'created_at': ticket.created_at.isoformat() if ticket.created_at else None,
        'called_at': ticket.called_at.isoformat() if ticket.called_at else None,
    }
    
    # Notificar a grupos relevantes
    groups = ['checkins', 'tickets']
    
    for group in groups:
        async_to_sync(channel_layer.group_send)(
            group,
            {
                'type': 'new_ticket',
                'ticket': ticket_data,
            }
        )


def notify_slider_update():
    """
    Notifica que los sliders fueron actualizados (nuevo, eliminado o modificado).
    """
    channel_layer = get_channel_layer()
    
    if channel_layer is None:
        return
    
    # Notificar a la sala de espera para que recargue los sliders
    groups = ['checkins', 'display']
    
    for group in groups:
        async_to_sync(channel_layer.group_send)(
            group,
            {
                'type': 'slider_update',
            }
        )