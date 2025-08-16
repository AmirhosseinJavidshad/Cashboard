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

# ---------------- Push Endpoint ----------------
class SyncPushView(APIView):
    permission_classes = [IsAuthenticated]  # requires login

    def post(self, request):
        user = request.user if request.user.is_authenticated else None
        data = request.data  # expect dict: {"transactions": [...], "persons": [...], ...}
        response_data = {}

        # Helper to handle each model
        def sync_model(model_class, serializer_class, items):
            synced = []
            for item in items:
                client_uuid = item.get('client_uuid')
                if not client_uuid:
                    continue  # skip items without UUID

                obj, created = model_class.objects.get_or_create(
                    client_uuid=client_uuid,
                    defaults={**item, 'user': user}
                )
                # Update existing object
                if not created:
                    for key, value in item.items():
                        setattr(obj, key, value)
                    obj.user = user
                    obj.updated_at = timezone.now()
                    obj.save()
                synced.append(obj.client_uuid)
            return synced

        # Transactions
        transactions = data.get('transactions', [])
        response_data['transactions'] = sync_model(Transaction, TransactionSerializer, transactions)

        # Persons
        persons = data.get('persons', [])
        response_data['persons'] = sync_model(Person, PersonSerializer, persons)

        # Events
        events = data.get('events', [])
        response_data['events'] = sync_model(Event, EventSerializer, events)

        # WishlistItems
        wishlist = data.get('wishlist', [])
        response_data['wishlist'] = sync_model(WishlistItem, WishlistItemSerializer, wishlist)

        return Response(response_data, status=status.HTTP_200_OK)


# ---------------- Pull Endpoint ----------------
class SyncPullView(APIView):
    permission_classes = []  # allows access without login

    def get(self, request):
        user = request.user if request.user.is_authenticated else None
        since = request.query_params.get('since')  # ISO string timestamp
        if since:
            try:
                since_dt = timezone.datetime.fromisoformat(since)
            except:
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
