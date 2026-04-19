from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


class User(AbstractUser):
    """
    Usuario personalizado con roles para el sistema de clínica.
    Roles: ADMIN, RECEPTIONIST, SPECIALIST
    """
    ROLE_CHOICES = [
        ('ADMIN', 'Administrador'),
        ('RECEPTIONIST', 'Recepcionista'),
        ('SPECIALIST', 'Especialista'),
    ]
    
    role = models.CharField(
        max_length=20, 
        choices=ROLE_CHOICES,
        default='SPECIALIST',
        verbose_name='Rol'
    )
    phone = models.CharField(
        max_length=20, 
        blank=True, 
        null=True,
        verbose_name='Teléfono'
    )
    # Campo opcional para especialistas: nombre del consultorio
    office = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Consultorio'
    )
    
    class Meta:
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'
    
    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
    
    @property
    def is_specialist(self):
        return self.role == 'SPECIALIST'
    
    @property
    def is_receptionist(self):
        return self.role == 'RECEPTIONIST'
    
    @property
    def is_admin_user(self):
        return self.role == 'ADMIN'


class Patient(models.Model):
    """
    Modelo para almacenar información de pacientes.
    """
    first_name = models.CharField(
        max_length=50,
        verbose_name='Nombre'
    )
    last_name = models.CharField(
        max_length=50,
        verbose_name='Apellido'
    )
    ci_number = models.CharField(
        max_length=20, 
        unique=True,
        verbose_name='Número de Cédula'
    )
    phone = models.CharField(
        max_length=20, 
        blank=True, 
        null=True,
        verbose_name='Teléfono'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de creación'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Fecha de actualización'
    )
    
    class Meta:
        verbose_name = 'Paciente'
        verbose_name_plural = 'Pacientes'
        ordering = ['last_name', 'first_name']
    
    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.ci_number})"
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"


class Checkin(models.Model):
    """
    Modelo para registrar cada check-in de paciente.
    Representa un ticket generado en el kiosko.
    """
    STATUS_CHOICES = [
        ('WAITING', 'En espera'),
        ('CALLED', 'Llamado'),
        ('ATTENDED', 'Atendido'),
        ('CANCELED', 'Cancelado'),
    ]
    
    patient = models.ForeignKey(
        Patient, 
        on_delete=models.CASCADE,
        related_name='checkins',
        verbose_name='Paciente'
    )
    specialist = models.ForeignKey(
        User, 
        on_delete=models.CASCADE,
        limit_choices_to={'role': 'SPECIALIST'},
        related_name='checkins',
        verbose_name='Especialista'
    )
    ticket_number = models.CharField(
        max_length=10,
        verbose_name='Número de Ticket'
    )
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES,
        default='WAITING',
        verbose_name='Estado'
    )
    reason = models.CharField(
        max_length=255, 
        blank=True, 
        null=True,
        verbose_name='Motivo de consulta'
    )
    checkin_time = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Hora de registro'
    )
    called_time = models.DateTimeField(
        blank=True, 
        null=True,
        verbose_name='Hora de llamado'
    )
    attended_time = models.DateTimeField(
        blank=True, 
        null=True,
        verbose_name='Hora de atención'
    )
    
    class Meta:
        verbose_name = 'Check-in'
        verbose_name_plural = 'Check-ins'
        ordering = ['-checkin_time']
    
    def __str__(self):
        return f"{self.ticket_number} - {self.patient} ({self.get_status_display()})"
    
    def save(self, *args, **kwargs):
        # Generar ticket_number automáticamente si no existe
        if not self.ticket_number:
            self.ticket_number = self.generate_ticket_number()
        super().save(*args, **kwargs)
    
    @classmethod
    def generate_ticket_number(cls):
        """
        Genera un número de ticket con formato: A-XX
        donde XX es el número secuencial del día.
        """
        today = timezone.now().date()
        today_start = timezone.make_aware(
            timezone.datetime.combine(today, timezone.datetime.min.time())
        )
        today_end = timezone.make_aware(
            timezone.datetime.combine(today, timezone.datetime.max.time())
        )
        
        # Contar check-ins del día
        count = cls.objects.filter(
            checkin_time__range=(today_start, today_end)
        ).count()
        
        # Generar número de ticket (A-01, A-02, etc.)
        return f"A-{count + 1:02d}"
    
    def mark_as_called(self):
        """Marca el check-in como llamado."""
        self.status = 'CALLED'
        self.called_time = timezone.now()
        self.save()
    
    def mark_as_attended(self):
        """Marca el check-in como atendido."""
        self.status = 'ATTENDED'
        self.attended_time = timezone.now()
        self.save()
    
    def mark_as_canceled(self):
        """Marca el check-in como cancelado."""
        self.status = 'CANCELED'
        self.save()


class Ticket(models.Model):
    """
    Modelo simple para tickets de turno.
    Solo genera un número secuencial sin datos del paciente.
    """
    STATUS_CHOICES = [
        ('WAITING', 'En espera'),
        ('CALLED', 'Llamado'),
        ('ATTENDED', 'Atendido'),
        ('CANCELED', 'Cancelado'),
    ]
    
    SERVICE_CHOICES = [
        ('RESULTS', 'Retirar Resultados'),
        ('ANALYSIS', 'Realizar Análisis'),
        ('BUDGET', 'Solicitar Presupuesto'),
    ]
    
    ticket_number = models.CharField(
        max_length=10,
        verbose_name='Número de Ticket'
    )
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES,
        default='WAITING',
        verbose_name='Estado'
    )
    service_type = models.CharField(
        max_length=20,
        choices=SERVICE_CHOICES,
        default='ANALYSIS',
        verbose_name='Servicio / Prioridad'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Hora de creación'
    )
    called_at = models.DateTimeField(
        blank=True, 
        null=True,
        verbose_name='Hora de llamado'
    )
    attended_at = models.DateTimeField(
        blank=True, 
        null=True,
        verbose_name='Hora de atención'
    )
    
    class Meta:
        verbose_name = 'Ticket'
        verbose_name_plural = 'Tickets'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.ticket_number} ({self.get_status_display()})"
    
    def save(self, *args, **kwargs):
        if not self.ticket_number:
            self.ticket_number = self.generate_ticket_number(self.service_type)
        super().save(*args, **kwargs)
    
    @classmethod
    def generate_ticket_number(cls, service_type='ANALYSIS'):
        """Genera número de ticket: R-01, A-02, P-01, etc."""
        from datetime import timedelta
        
        # Prefijos según tipo de servicio
        prefixes = {
            'RESULTS': 'R',   # Retirar Resultados - Prefijo R
            'ANALYSIS': 'A',  # Realizar Análisis - Prefijo A
            'BUDGET': 'P',    # Solicitar Presupuesto - Prefijo P
        }
        prefix = prefixes.get(service_type, 'A')
        
        # Usar timezone local para el conteo
        now = timezone.localtime(timezone.now())
        today = now.date()
        
        # Crear rango del día en timezone local
        today_start = timezone.make_aware(
            timezone.datetime.combine(today, timezone.datetime.min.time()),
            timezone.get_current_timezone()
        )
        today_end = today_start + timedelta(days=1)
        
        # Contar tickets del MISMO TIPO en el día
        count = cls.objects.filter(
            created_at__gte=today_start,
            created_at__lt=today_end,
            service_type=service_type
        ).count()
        
        return f"{prefix}-{count + 1:02d}"
    
    def mark_as_called(self):
        self.status = 'CALLED'
        self.called_at = timezone.now()
        self.save()
    
    def mark_as_attended(self):
        self.status = 'ATTENDED'
        self.attended_at = timezone.now()
        self.save()
        
    def mark_as_canceled(self):
        self.status = 'CANCELED'
        self.save()


class Slider(models.Model):
    """
    Modelo para sliders/banners que se muestran en la sala de espera.
    Soporta imágenes y videos.
    """
    MEDIA_TYPE_CHOICES = [
        ('IMAGE', 'Imagen'),
        ('VIDEO', 'Video'),
    ]
    
    title = models.CharField(
        max_length=100,
        verbose_name='Título'
    )
    media_type = models.CharField(
        max_length=10,
        choices=MEDIA_TYPE_CHOICES,
        default='IMAGE',
        verbose_name='Tipo de medio'
    )
    image = models.ImageField(
        upload_to='sliders/',
        verbose_name='Imagen',
        blank=True,
        null=True
    )
    video = models.FileField(
        upload_to='sliders/videos/',
        verbose_name='Video',
        blank=True,
        null=True
    )
    duration = models.IntegerField(
        default=5,
        verbose_name='Duración (segundos)',
        help_text='Tiempo de visualización para imágenes'
    )
    order = models.IntegerField(
        default=0,
        verbose_name='Orden'
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='Activo'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de creación'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Fecha de actualización'
    )
    
    class Meta:
        verbose_name = 'Slider'
        verbose_name_plural = 'Sliders'
        ordering = ['order', '-created_at']
    
    def __str__(self):
        return f"{self.title} ({self.get_media_type_display()})"
