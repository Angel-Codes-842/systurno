from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Patient, Checkin, Ticket, Slider

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Serializer para el modelo User."""
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'phone', 'office', 'is_active'
        ]
        read_only_fields = ['id']


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear usuarios con contraseña."""
    password = serializers.CharField(write_only=True, min_length=8)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'password', 'first_name', 'last_name',
            'role', 'phone', 'office'
        ]
        read_only_fields = ['id']
    
    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class SpecialistSerializer(serializers.ModelSerializer):
    """Serializer simplificado para mostrar especialistas en el kiosko."""
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'full_name', 'office']
    
    def get_full_name(self, obj):
        if obj.first_name and obj.last_name:
            return f"{obj.first_name} {obj.last_name}"
        return obj.username


class PatientSerializer(serializers.ModelSerializer):
    """Serializer para el modelo Patient."""
    full_name = serializers.ReadOnlyField()
    
    class Meta:
        model = Patient
        fields = [
            'id', 'first_name', 'last_name', 'full_name',
            'ci_number', 'phone', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class PatientCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear pacientes desde el kiosko."""
    
    class Meta:
        model = Patient
        fields = ['id', 'first_name', 'last_name', 'ci_number', 'phone']
        read_only_fields = ['id']


class CheckinSerializer(serializers.ModelSerializer):
    """Serializer para el modelo Checkin."""
    patient = PatientSerializer(read_only=True)
    specialist = SpecialistSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Checkin
        fields = [
            'id', 'patient', 'specialist', 'ticket_number', 'status',
            'status_display', 'reason', 'checkin_time', 'called_time', 'attended_time'
        ]
        read_only_fields = ['id', 'ticket_number', 'checkin_time', 'called_time', 'attended_time']


class CheckinCreateSerializer(serializers.Serializer):
    """
    Serializer para crear check-ins desde el kiosko.
    Maneja la creación/obtención del paciente automáticamente.
    """
    # Datos del paciente
    ci_number = serializers.CharField(max_length=20)
    first_name = serializers.CharField(max_length=50)
    last_name = serializers.CharField(max_length=50)
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    
    # Datos del check-in
    specialist_id = serializers.IntegerField()
    reason = serializers.CharField(max_length=255, required=False, allow_blank=True)
    
    def validate_specialist_id(self, value):
        """Validar que el especialista existe y tiene rol SPECIALIST."""
        try:
            specialist = User.objects.get(id=value, role='SPECIALIST', is_active=True)
        except User.DoesNotExist:
            raise serializers.ValidationError("Especialista no encontrado o no válido.")
        return value
    
    def create(self, validated_data):
        """Crear o obtener paciente y crear check-in."""
        # Extraer datos del paciente
        ci_number = validated_data['ci_number']
        first_name = validated_data['first_name']
        last_name = validated_data['last_name']
        phone = validated_data.get('phone', '')
        
        # Crear o actualizar paciente
        patient, created = Patient.objects.update_or_create(
            ci_number=ci_number,
            defaults={
                'first_name': first_name,
                'last_name': last_name,
                'phone': phone if phone else None,
            }
        )
        
        # Obtener especialista
        specialist = User.objects.get(id=validated_data['specialist_id'])
        
        # Crear check-in
        checkin = Checkin.objects.create(
            patient=patient,
            specialist=specialist,
            reason=validated_data.get('reason', '')
        )
        
        return checkin


class CheckinUpdateStatusSerializer(serializers.Serializer):
    """Serializer para actualizar el estado de un check-in."""
    STATUS_CHOICES = ['WAITING', 'CALLED', 'ATTENDED', 'CANCELED']
    
    status = serializers.ChoiceField(choices=STATUS_CHOICES)
    
    def update(self, instance, validated_data):
        new_status = validated_data['status']
        
        if new_status == 'CALLED':
            instance.mark_as_called()
        elif new_status == 'ATTENDED':
            instance.mark_as_attended()
        elif new_status == 'CANCELED':
            instance.mark_as_canceled()
        else:
            instance.status = new_status
            instance.save()
        
        return instance


class CheckinListSerializer(serializers.ModelSerializer):
    """Serializer para listar check-ins con objetos completos."""
    patient = PatientSerializer(read_only=True)
    specialist = SpecialistSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Checkin
        fields = [
            'id', 'patient', 'specialist', 'ticket_number', 'status',
            'status_display', 'reason', 'checkin_time', 'called_time', 'attended_time'
        ]
        read_only_fields = ['id', 'ticket_number', 'checkin_time', 'called_time', 'attended_time']


class TicketSerializer(serializers.ModelSerializer):
    """Serializer para el modelo Ticket (sistema simple de turnos)."""
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    service_type_display = serializers.CharField(source='get_service_type_display', read_only=True)
    
    class Meta:
        model = Ticket
        fields = [
            'id', 'ticket_number', 'status', 'status_display',
            'service_type', 'service_type_display',
            'created_at', 'called_at', 'attended_at'
        ]
        read_only_fields = ['id', 'ticket_number', 'created_at', 'called_at', 'attended_at']



class SliderSerializer(serializers.ModelSerializer):
    """Serializer para el modelo Slider."""
    image_url = serializers.SerializerMethodField()
    video_url = serializers.SerializerMethodField()
    media_type_display = serializers.CharField(source='get_media_type_display', read_only=True)
    
    class Meta:
        model = Slider
        fields = [
            'id', 'title', 'media_type', 'media_type_display', 
            'image', 'image_url', 'video', 'video_url', 
            'duration', 'order', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None
    
    def get_video_url(self, obj):
        if obj.video:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.video.url)
            return obj.video.url
        return None
