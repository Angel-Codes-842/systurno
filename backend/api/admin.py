from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth import get_user_model
from .models import Patient, Checkin, Slider

User = get_user_model()


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Admin personalizado para el modelo User."""
    
    list_display = ['username', 'email', 'first_name', 'last_name', 'role', 'office', 'is_active']
    list_filter = ['role', 'is_active', 'is_staff']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering = ['username']
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Información adicional', {
            'fields': ('role', 'phone', 'office'),
        }),
    )
    
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Información adicional', {
            'fields': ('role', 'phone', 'office', 'first_name', 'last_name'),
        }),
    )


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    """Admin para el modelo Patient."""
    
    list_display = ['ci_number', 'first_name', 'last_name', 'phone', 'created_at']
    list_filter = ['created_at']
    search_fields = ['ci_number', 'first_name', 'last_name', 'phone']
    ordering = ['-created_at']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Información personal', {
            'fields': ('first_name', 'last_name', 'ci_number', 'phone'),
        }),
        ('Fechas', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )


@admin.register(Checkin)
class CheckinAdmin(admin.ModelAdmin):
    """Admin para el modelo Checkin."""
    
    list_display = [
        'ticket_number', 'patient', 'specialist', 'status', 
        'checkin_time', 'called_time', 'attended_time'
    ]
    list_filter = ['status', 'specialist', 'checkin_time']
    search_fields = [
        'ticket_number', 'patient__first_name', 'patient__last_name',
        'patient__ci_number', 'specialist__username'
    ]
    ordering = ['-checkin_time']
    readonly_fields = ['ticket_number', 'checkin_time', 'called_time', 'attended_time']
    raw_id_fields = ['patient', 'specialist']
    date_hierarchy = 'checkin_time'
    
    fieldsets = (
        ('Información del ticket', {
            'fields': ('ticket_number', 'status', 'reason'),
        }),
        ('Relaciones', {
            'fields': ('patient', 'specialist'),
        }),
        ('Tiempos', {
            'fields': ('checkin_time', 'called_time', 'attended_time'),
            'classes': ('collapse',),
        }),
    )
    
    def get_queryset(self, request):
        """Optimizar consultas con select_related."""
        queryset = super().get_queryset(request)
        return queryset.select_related('patient', 'specialist')



@admin.register(Slider)
class SliderAdmin(admin.ModelAdmin):
    """Admin para el modelo Slider."""
    
    list_display = ['title', 'media_type', 'duration', 'order', 'is_active', 'created_at']
    list_filter = ['media_type', 'is_active', 'created_at']
    search_fields = ['title']
    ordering = ['order', '-created_at']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Información', {
            'fields': ('title', 'media_type', 'duration', 'order', 'is_active'),
        }),
        ('Medios', {
            'fields': ('image', 'video'),
        }),
        ('Fechas', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )
