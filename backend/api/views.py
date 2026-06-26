from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.db.models import Q, Count
from django.utils import timezone
from django.http import HttpResponse
from datetime import datetime, timedelta
from io import BytesIO

def get_today_time_range():
    """Helper method to get the start and end of the current day in the local timezone."""
    now = timezone.localtime(timezone.now())
    today_start = timezone.make_aware(
        datetime.combine(now.date(), datetime.min.time()),
        timezone.get_current_timezone()
    )
    return today_start, today_start + timedelta(days=1)

from .models import Patient, Checkin, Ticket, Slider
from .serializers import (
    UserSerializer, UserCreateSerializer, SpecialistSerializer,
    PatientSerializer, PatientCreateSerializer,
    CheckinSerializer, CheckinCreateSerializer,
    CheckinUpdateStatusSerializer, CheckinListSerializer,
    TicketSerializer, SliderSerializer
)
from .services import notify_new_checkin, notify_call_patient, notify_status_update, notify_ticket_called, notify_new_ticket, notify_slider_update

User = get_user_model()


class IsAdminUser(permissions.BasePermission):
    """Permiso para solo administradores."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'ADMIN'


class IsSpecialist(permissions.BasePermission):
    """Permiso para especialistas."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'SPECIALIST'


class IsAdminOrReadOnly(permissions.BasePermission):
    """Permiso de lectura para todos, escritura solo para admins."""
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        return request.user.is_authenticated and request.user.role == 'ADMIN'


class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar usuarios.
    Solo accesible por administradores.
    """
    queryset = User.objects.all()
    permission_classes = [IsAdminUser]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        return UserSerializer
    
    def get_queryset(self):
        queryset = User.objects.all()
        role = self.request.query_params.get('role', None)
        if role:
            queryset = queryset.filter(role=role)
        return queryset
    
    @action(detail=False, methods=['get'])
    def specialists(self, request):
        """Lista de especialistas activos."""
        specialists = User.objects.filter(role='SPECIALIST', is_active=True)
        serializer = SpecialistSerializer(specialists, many=True)
        return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def list_specialists(request):
    """
    Endpoint público para listar especialistas.
    Usado por el kiosko para mostrar opciones.
    """
    specialists = User.objects.filter(role='SPECIALIST', is_active=True)
    serializer = SpecialistSerializer(specialists, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def text_to_speech(request):
    """Genera audio TTS local y offline con Piper, con fallback a gTTS."""
    text = request.query_params.get('text', '').strip()
    lang = request.query_params.get('lang', 'es')
    if not text:
        return Response({'detail': 'El texto es requerido.'}, status=status.HTTP_400_BAD_REQUEST)

    import os
    import subprocess
    import tempfile

    # Definir rutas para el ejecutable y modelo de Piper
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    piper_exe = os.path.join(backend_dir, "piper", "piper.exe")
    model_path = os.path.join(backend_dir, "piper", "voices", "es_ES-davefx-medium.onnx")

    # Intentar generar el audio de forma local y offline con Piper
    if os.path.exists(piper_exe) and os.path.exists(model_path):
        try:
            with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_wav:
                temp_wav_path = temp_wav.name

            p = subprocess.Popen(
                [piper_exe, "--model", model_path, "--output_file", temp_wav_path, "--length_scale", "0.85"],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            stdout, stderr = p.communicate(input=text.encode('utf-8'))

            if p.returncode == 0 and os.path.exists(temp_wav_path):
                with open(temp_wav_path, 'rb') as f:
                    audio_data = f.read()
                try:
                    os.remove(temp_wav_path)
                except OSError:
                    pass
                return HttpResponse(audio_data, content_type='audio/wav')
            else:
                err_msg = stderr.decode('utf-8', errors='ignore')
                print(f"Error al ejecutar Piper (código {p.returncode}): {err_msg}")
        except Exception as e:
            print(f"Excepción al ejecutar Piper local: {e}")

    # Si llega aquí, significa que falló Piper y no hay fallback
    return Response(
        {'detail': 'Error al generar el audio localmente con la voz seleccionada (Piper).'},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )


class PatientViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar pacientes.
    """
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = Patient.objects.all()
        ci_number = self.request.query_params.get('ci', None)
        search = self.request.query_params.get('search', None)
        
        if ci_number:
            queryset = queryset.filter(ci_number=ci_number)
        if search:
            queryset = queryset.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(ci_number__icontains=search)
            )
        return queryset
    
    @action(detail=False, methods=['get'])
    def by_ci(self, request):
        """Buscar paciente por CI."""
        ci_number = request.query_params.get('ci', None)
        if not ci_number:
            return Response(
                {'error': 'Se requiere el parámetro ci'},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            patient = Patient.objects.get(ci_number=ci_number)
            serializer = PatientSerializer(patient)
            return Response(serializer.data)
        except Patient.DoesNotExist:
            return Response(
                {'error': 'Paciente no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )


class CheckinViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar check-ins.
    """
    queryset = Checkin.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    
    def get_permissions(self):
        """
        Permitir creación de check-ins sin autenticación (kiosko).
        Todos los demás endpoints requieren autenticación.
        """
        if self.action == 'create':
            return [permissions.AllowAny()]
        return super().get_permissions()
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CheckinCreateSerializer
        if self.action == 'list':
            return CheckinListSerializer
        if self.action == 'update_status':
            return CheckinUpdateStatusSerializer
        return CheckinSerializer
    
    def get_queryset(self):
        queryset = Checkin.objects.all()
        user = self.request.user
        
        # Si es especialista, solo ve sus check-ins
        if user.role == 'SPECIALIST':
            queryset = queryset.filter(specialist=user)
        
        # Filtros opcionales
        status_filter = self.request.query_params.get('status', None)
        date_filter = self.request.query_params.get('date', None)
        specialist_id = self.request.query_params.get('specialist', None)
        today_only = self.request.query_params.get('today', None)
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        if date_filter:
            try:
                filter_date = datetime.strptime(date_filter, '%Y-%m-%d').date()
                queryset = queryset.filter(checkin_time__date=filter_date)
            except ValueError:
                pass
        
        if today_only:
            queryset = queryset.filter(checkin_time__date=timezone.now().date())
        
        if specialist_id and user.role != 'SPECIALIST':
            queryset = queryset.filter(specialist_id=specialist_id)
        
        return queryset.order_by('checkin_time')
    
    def create(self, request, *args, **kwargs):
        """Crear check-in desde el kiosko."""
        serializer = CheckinCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        checkin = serializer.save()
        
        # Notificar via WebSocket
        notify_new_checkin(checkin)
        
        # Devolver el check-in creado con todos los datos
        response_serializer = CheckinSerializer(checkin)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """
        Actualizar el estado de un check-in.
        Endpoint: POST /api/checkins/{id}/update_status/
        Body: {"status": "CALLED" | "ATTENDED" | "CANCELED"}
        """
        checkin = self.get_object()
        serializer = CheckinUpdateStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        updated_checkin = serializer.update(checkin, serializer.validated_data)
        response_serializer = CheckinSerializer(updated_checkin)
        return Response(response_serializer.data)
    
    @action(detail=True, methods=['post'])
    def call(self, request, pk=None):
        """
        Llamar a un paciente.
        Endpoint: POST /api/checkins/{id}/call/
        """
        checkin = self.get_object()
        
        if checkin.status != 'WAITING':
            return Response(
                {'error': 'Solo se pueden llamar pacientes en espera'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        checkin.mark_as_called()
        
        # Notificar via WebSocket (llamado de paciente)
        notify_call_patient(checkin)
        
        serializer = CheckinSerializer(checkin)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def attend(self, request, pk=None):
        """
        Marcar paciente como atendido.
        Endpoint: POST /api/checkins/{id}/attend/
        """
        checkin = self.get_object()
        
        if checkin.status not in ['WAITING', 'CALLED']:
            return Response(
                {'error': 'Solo se pueden atender pacientes en espera o llamados'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        checkin.mark_as_attended()
        
        # Notificar via WebSocket
        notify_status_update(checkin)
        
        serializer = CheckinSerializer(checkin)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """
        Cancelar un check-in.
        Endpoint: POST /api/checkins/{id}/cancel/
        """
        checkin = self.get_object()
        
        if checkin.status == 'ATTENDED':
            return Response(
                {'error': 'No se puede cancelar un paciente ya atendido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        checkin.mark_as_canceled()
        
        # Notificar via WebSocket
        notify_status_update(checkin)
        
        serializer = CheckinSerializer(checkin)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def today(self, request):
        """
        Obtener check-ins del día actual.
        Endpoint: GET /api/checkins/today/
        """
        queryset = self.get_queryset().filter(
            checkin_time__date=timezone.now().date()
        ).order_by('checkin_time')
        serializer = CheckinListSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def waiting(self, request):
        """
        Obtener check-ins en espera del día.
        Endpoint: GET /api/checkins/waiting/
        """
        queryset = self.get_queryset().filter(
            status='WAITING',
            checkin_time__date=timezone.now().date()
        ).order_by('checkin_time')
        serializer = CheckinListSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Estadísticas del día.
        Endpoint: GET /api/checkins/stats/
        """
        today = timezone.now().date()
        queryset = Checkin.objects.filter(checkin_time__date=today)
        
        # Si es especialista, solo sus stats
        if request.user.role == 'SPECIALIST':
            queryset = queryset.filter(specialist=request.user)
        
        aggs = queryset.aggregate(
            total_count=Count('id'),
            waiting_count=Count('id', filter=Q(status='WAITING')),
            called_count=Count('id', filter=Q(status='CALLED')),
            attended_count=Count('id', filter=Q(status='ATTENDED')),
            canceled_count=Count('id', filter=Q(status='CANCELED'))
        )
        
        stats = {
            'total': aggs['total_count'] or 0,
            'waiting': aggs['waiting_count'] or 0,
            'called': aggs['called_count'] or 0,
            'attended': aggs['attended_count'] or 0,
            'canceled': aggs['canceled_count'] or 0,
        }
        return Response(stats)





class CurrentUserView(APIView):
    """Vista para obtener el usuario actual."""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class TicketViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar tickets simples (sin datos de paciente).
    Usado por el kiosko para generar turnos.
    """
    queryset = Ticket.objects.all()
    serializer_class = TicketSerializer
    
    def get_permissions(self):
        """Permitir acceso público a todas las acciones de tickets."""
        # El sistema de turnos es público - no requiere autenticación
        return [permissions.AllowAny()]
    
    def get_queryset(self):
        queryset = Ticket.objects.all()
        
        # Filtros opcionales
        status_filter = self.request.query_params.get('status', None)
        today_only = self.request.query_params.get('today', None)
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        if today_only:
            today_start, today_end = get_today_time_range()
            queryset = queryset.filter(created_at__gte=today_start, created_at__lt=today_end)
        
        # Ordenamiento según estado
        if status_filter == 'WAITING':
            from django.db.models import Case, When, Value, IntegerField
            # Prioridad: 1. Retirar Resultados, 2. Presupuesto, 3. Realizar Análisis
            queryset = queryset.annotate(
                priority=Case(
                    When(service_type='RESULTS', then=Value(1)),
                    When(service_type='BUDGET', then=Value(2)),
                    When(service_type='ANALYSIS', then=Value(3)),
                    default=Value(4),
                    output_field=IntegerField(),
                )
            )
            return queryset.order_by('priority', 'created_at')
        elif status_filter == 'CALLED':
            return queryset.order_by('-called_at')
        elif status_filter == 'ATTENDED':
            return queryset.order_by('-attended_at')
        elif status_filter == 'CANCELED':
            return queryset.order_by('-created_at')
        else:
            return queryset.order_by('created_at')
    
    @action(detail=False, methods=['post'])
    def generate(self, request):
        """
        Generar un nuevo ticket.
        Endpoint: POST /api/tickets/generate/
        Body: {"service_type": "ANALYSIS"} (opcional)
        """
        service_type = request.data.get('service_type', 'ANALYSIS')
        ticket = Ticket.objects.create(service_type=service_type)
        
        # Notificar via WebSocket
        notify_new_ticket(ticket)
        
        serializer = TicketSerializer(ticket)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def call(self, request, pk=None):
        """
        Llamar un ticket.
        Endpoint: POST /api/tickets/{id}/call/
        """
        ticket = self.get_object()
        
        if ticket.status not in ['WAITING', 'CALLED']:
            return Response(
                {'error': 'Solo se pueden llamar tickets en espera o ya llamados'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        ticket.mark_as_called()
        
        # Notificar via WebSocket
        notify_ticket_called(ticket)
        
        serializer = TicketSerializer(ticket)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def attend(self, request, pk=None):
        """
        Marcar ticket como atendido.
        Endpoint: POST /api/tickets/{id}/attend/
        """
        ticket = self.get_object()
        
        if ticket.status not in ['WAITING', 'CALLED']:
            return Response(
                {'error': 'Solo se pueden atender tickets en espera o llamados'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        ticket.mark_as_attended()
        
        # Notificar via WebSocket que el estado del ticket cambió
        notify_ticket_called(ticket)
        
        serializer = TicketSerializer(ticket)
        return Response(serializer.data)
        
    @action(detail=True, methods=['post'])
    def recall(self, request, pk=None):
        """
        Volver a llamar un ticket que ya está en estado CALLED.
        Endpoint: POST /api/tickets/{id}/recall/
        """
        ticket = self.get_object()
        
        if ticket.status != 'CALLED':
            return Response(
                {'error': 'Solo se pueden re-llamar tickets que ya están llamados.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Actualizar la hora de llamado para que se ordene arriba en el display e historial
        ticket.called_at = timezone.now()
        ticket.save()
        
        # Al volver a notificar, se ejecuta el campanazo y el flash de TV
        notify_ticket_called(ticket)
        
        serializer = TicketSerializer(ticket)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """
        Marcar ticket como cancelado (ausente).
        Endpoint: POST /api/tickets/{id}/cancel/
        """
        ticket = self.get_object()
        
        if ticket.status not in ['WAITING', 'CALLED']:
            return Response(
                {'error': 'Solo se pueden cancelar tickets en espera o llamados'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        ticket.mark_as_canceled()
        
        # Notificar via WebSocket que el estado del ticket cambió
        notify_ticket_called(ticket)
        
        serializer = TicketSerializer(ticket)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def waiting(self, request):
        """
        Obtener tickets en espera del día.
        Endpoint: GET /api/tickets/waiting/
        """
        from django.db.models import Case, When, Value, IntegerField
        today_start, today_end = get_today_time_range()
        
        queryset = Ticket.objects.filter(
            status='WAITING',
            created_at__gte=today_start,
            created_at__lt=today_end
        ).annotate(
            priority=Case(
                When(service_type='RESULTS', then=Value(1)),
                When(service_type='BUDGET', then=Value(2)),
                When(service_type='ANALYSIS', then=Value(3)),
                default=Value(4),
                output_field=IntegerField(),
            )
        ).order_by('priority', 'created_at')
        serializer = TicketSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def called(self, request):
        """
        Obtener tickets llamados del día (incluyendo atendidos o cancelados).
        Endpoint: GET /api/tickets/called/
        """
        today_start, today_end = get_today_time_range()
        
        queryset = Ticket.objects.filter(
            called_at__gte=today_start,
            called_at__lt=today_end
        ).order_by('-called_at')
        serializer = TicketSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def attended(self, request):
        """
        Obtener tickets atendidos del día.
        Endpoint: GET /api/tickets/attended/
        """
        today_start, today_end = get_today_time_range()
        
        queryset = Ticket.objects.filter(
            status='ATTENDED',
            created_at__gte=today_start,
            created_at__lt=today_end
        ).order_by('-attended_at')
        serializer = TicketSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def today(self, request):
        """
        Obtener todos los tickets del día.
        Endpoint: GET /api/tickets/today/
        """
        today_start, today_end = get_today_time_range()
        
        queryset = Ticket.objects.filter(
            created_at__gte=today_start,
            created_at__lt=today_end
        ).order_by('created_at')
        serializer = TicketSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Estadísticas de tickets del día.
        Endpoint: GET /api/tickets/stats/
        """
        today_start, today_end = get_today_time_range()
        
        queryset = Ticket.objects.filter(
            created_at__gte=today_start,
            created_at__lt=today_end
        )
        
        aggs = queryset.aggregate(
            total_count=Count('id'),
            waiting_count=Count('id', filter=Q(status='WAITING')),
            called_count=Count('id', filter=Q(status='CALLED')),
            attended_count=Count('id', filter=Q(status='ATTENDED')),
            canceled_count=Count('id', filter=Q(status='CANCELED'))
        )
        
        stats = {
            'total': aggs['total_count'] or 0,
            'waiting': aggs['waiting_count'] or 0,
            'called': aggs['called_count'] or 0,
            'attended': aggs['attended_count'] or 0,
            'canceled': aggs['canceled_count'] or 0,
        }
        return Response(stats)



class SliderViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar sliders.
    """
    queryset = Slider.objects.all()
    serializer_class = SliderSerializer
    pagination_class = None  # Deshabilitar paginación para sliders
    
    def get_permissions(self):
        """Permitir acceso público a todas las operaciones de sliders."""
        # En una red LAN cerrada, permitimos gestión sin autenticación
        # Para producción, considerar requerir autenticación para create/update/delete
        return [permissions.AllowAny()]
    
    def get_serializer_context(self):
        """Agregar request al contexto para construir URLs absolutas."""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def create(self, request, *args, **kwargs):
        """Crear slider y notificar a sala de espera."""
        response = super().create(request, *args, **kwargs)
        notify_slider_update()
        return response
    
    def update(self, request, *args, **kwargs):
        """Actualizar slider y notificar a sala de espera."""
        response = super().update(request, *args, **kwargs)
        notify_slider_update()
        return response
    
    def partial_update(self, request, *args, **kwargs):
        """Actualizar parcialmente slider y notificar a sala de espera."""
        response = super().partial_update(request, *args, **kwargs)
        notify_slider_update()
        return response
    
    def destroy(self, request, *args, **kwargs):
        """Eliminar slider y notificar a sala de espera."""
        response = super().destroy(request, *args, **kwargs)
        notify_slider_update()
        return response
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """
        Obtener sliders activos ordenados.
        Endpoint: GET /api/sliders/active/
        """
        queryset = Slider.objects.filter(is_active=True).order_by('order', '-created_at')
        serializer = SliderSerializer(queryset, many=True)
        return Response(serializer.data)
