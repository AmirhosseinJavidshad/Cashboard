from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from core.models import Transaction, Person, Event, WishlistItem
from core.serializers import (
    TransactionSerializer,
    PersonSerializer,
    EventSerializer,
    WishlistItemSerializer,
)
from django.utils import timezone
import uuid


# ---------------- Push Endpoint ----------------
class SyncPushView(APIView):
    permission_classes = [IsAuthenticated]  # requires login

    def post(self, request):
        user = request.user if request.user.is_authenticated else None
        data = request.data  # expect dict: {"transactions": [...], "persons": [...], ...}
        response_data = {}

        def is_valid_uuid(val):
            try:
                uuid.UUID(str(val))
                return True
            except (ValueError, TypeError):
                return False

        # Helper to handle each model
        def sync_model(model_class, serializer_class, items):
            synced = []
            read_only_fields = {"client_uuid", "user", "created_at", "updated_at"}

            for item in items:
                client_uuid = item.get("client_uuid")

                # Must have a valid UUID
                if not client_uuid or not is_valid_uuid(client_uuid):
                    continue

                obj, created = model_class.objects.get_or_create(
                    client_uuid=client_uuid,
                    defaults={**{k: v for k, v in item.items() if k not in read_only_fields},
                              "user": user}
                )

                # Update existing object (skip read-only fields)
                if not created:
                    for key, value in item.items():
                        if key not in read_only_fields:
                            setattr(obj, key, value)
                    obj.user = user
                    obj.updated_at = timezone.now()
                    obj.save()

                synced.append(str(obj.client_uuid))  # always return UUID as string

            return synced

        # Transactions
        response_data["transactions"] = sync_model(Transaction, TransactionSerializer, data.get("transactions", []))

        # Persons
        response_data["persons"] = sync_model(Person, PersonSerializer, data.get("persons", []))

        # Events
        response_data["events"] = sync_model(Event, EventSerializer, data.get("events", []))

        # WishlistItems
        response_data["wishlist"] = sync_model(WishlistItem, WishlistItemSerializer, data.get("wishlist", []))

        return Response(response_data, status=status.HTTP_200_OK)


# ---------------- Pull Endpoint ----------------
class SyncPullView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user if request.user.is_authenticated else None
        since = request.query_params.get("since")  # ISO string timestamp

        if since:
            try:
                since_dt = timezone.datetime.fromisoformat(since)
            except Exception:
                since_dt = None
        else:
            since_dt = None

        def pull_model(model_class, serializer_class):
            qs = model_class.objects.filter(user=user)
            if since_dt:
                qs = qs.filter(updated_at__gt=since_dt)
            serializer = serializer_class(qs, many=True)
            return serializer.data

        data = {
            "transactions": pull_model(Transaction, TransactionSerializer),
            "persons": pull_model(Person, PersonSerializer),
            "events": pull_model(Event, EventSerializer),
            "wishlist": pull_model(WishlistItem, WishlistItemSerializer),
        }

        return Response(data, status=status.HTTP_200_OK)
