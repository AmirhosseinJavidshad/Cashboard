# core/mixins.py
import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class TimestampedMixin(models.Model):
    client_uuid = models.UUIDField(null=True, blank=True, db_index=True, editable=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    user = models.ForeignKey(User, null=True, blank=True, on_delete=models.CASCADE, related_name="%(class)ss")

    class Meta:
        abstract = True
