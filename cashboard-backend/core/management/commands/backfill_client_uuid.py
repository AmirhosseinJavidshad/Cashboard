import uuid
from django.core.management.base import BaseCommand
from django.apps import apps

class Command(BaseCommand):
    help = "Backfill client_uuid for all TimestampedMixin models"

    def handle(self, *args, **options):
        for model in apps.get_models():
            if hasattr(model, 'client_uuid'):
                qs = model.objects.filter(client_uuid__isnull=True)
                count = qs.count()
                for obj in qs.iterator():
                    obj.client_uuid = uuid.uuid4()
                    obj.save(update_fields=['client_uuid'])
                self.stdout.write(f"{model.__name__}: Backfilled {count} rows")
