from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = 'Crear usuarios de prueba para el sistema de clínica'

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('\n🔧 Creando usuarios de prueba...\n'))

        # Admin
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser(
                username='admin',
                email='admin@clinica.com',
                password='admin123',
                role='ADMIN',
                first_name='Admin',
                last_name='Sistema'
            )
            self.stdout.write(self.style.SUCCESS('✓ Admin creado (usuario: admin, password: admin123)'))
        else:
            self.stdout.write(self.style.WARNING('⚠ Admin ya existe'))

        # Recepcionista
        if not User.objects.filter(username='recepcion').exists():
            User.objects.create_user(
                username='recepcion',
                email='recepcion@clinica.com',
                password='recepcion123',
                role='RECEPTIONIST',
                first_name='María',
                last_name='González',
                phone='0981123456'
            )
            self.stdout.write(self.style.SUCCESS('✓ Recepcionista creado (usuario: recepcion, password: recepcion123)'))
        else:
            self.stdout.write(self.style.WARNING('⚠ Recepcionista ya existe'))

        # Especialistas
        specialists = [
            ('dr.garcia', 'Carlos', 'García', '1', '0981234567'),
            ('dra.lopez', 'Ana', 'López', '2', '0981345678'),
            ('dr.martinez', 'Juan', 'Martínez', '3', '0981456789'),
        ]

        for username, first_name, last_name, office, phone in specialists:
            if not User.objects.filter(username=username).exists():
                User.objects.create_user(
                    username=username,
                    email=f'{username}@clinica.com',
                    password='specialist123',
                    role='SPECIALIST',
                    first_name=first_name,
                    last_name=last_name,
                    office=office,
                    phone=phone
                )
                self.stdout.write(
                    self.style.SUCCESS(
                        f'✓ Especialista {first_name} {last_name} creado '
                        f'(usuario: {username}, password: specialist123, consultorio: {office})'
                    )
                )
            else:
                self.stdout.write(self.style.WARNING(f'⚠ Especialista {username} ya existe'))

        self.stdout.write(self.style.SUCCESS('\n✅ Proceso completado\n'))
        self.stdout.write(self.style.SUCCESS('📋 Resumen de credenciales:\n'))
        self.stdout.write('   Admin:         usuario: admin         password: admin123')
        self.stdout.write('   Recepcionista: usuario: recepcion     password: recepcion123')
        self.stdout.write('   Especialistas: usuario: dr.garcia     password: specialist123')
        self.stdout.write('                  usuario: dra.lopez     password: specialist123')
        self.stdout.write('                  usuario: dr.martinez   password: specialist123\n')
