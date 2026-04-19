# Backend - Sistema de Turnos

Django + Django Channels (WebSocket)

## Desarrollo

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements-minimal.txt
python manage.py migrate
python manage.py runserver
```

## Producción (con WebSocket)

```bash
daphne -b 0.0.0.0 -p 8000 clinica_backend.asgi:application
```

## API Endpoints

### Tickets (público)
- `POST /api/tickets/generate/` - Generar nuevo ticket
- `GET /api/tickets/today/` - Tickets del día
- `GET /api/tickets/waiting/` - Tickets en espera
- `POST /api/tickets/{id}/call/` - Llamar ticket
- `POST /api/tickets/{id}/attend/` - Marcar como atendido

### WebSocket
- `ws://localhost:8000/ws/checkins/` - Notificaciones en tiempo real

## Variables de Entorno

```env
DEBUG=True
SECRET_KEY=tu-clave-secreta
ALLOWED_HOSTS=*
DB_ENGINE=django.db.backends.sqlite3
```
