from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from api.models import Ticket


class Command(BaseCommand):
    help = 'Elimina tickets antiguos (por defecto mayores a 7 días)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=7,
            help='Eliminar tickets más antiguos que X días (default: 7)'
        )

    def handle(self, *args, **options):
        days = options['days']
        cutoff_date = timezone.now() - timedelta(days=days)
        
        # Contar tickets a eliminar
        old_tickets = Ticket.objects.filter(created_at__lt=cutoff_date)
        count = old_tickets.count()
        
        if count > 0:
            old_tickets.delete()
            self.stdout.write(
                self.style.SUCCESS(f'✅ Eliminados {count} tickets anteriores a {cutoff_date.date()}')
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(f'✅ No hay tickets anteriores a {cutoff_date.date()}')
            )
