from rest_framework import viewsets, filters, status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .filters import TransactionFilter
from django.db.models import Sum
from .models import Transaction, Person, Event, WishlistItem, User
from .serializers import TransactionSerializer, PersonSerializer, EventSerializer, SummarySerializer, WishlistItemSerializer, UserSerializer
from core.utils.digikala_scraper import fetch_product_info  # adjust path as needed
from rest_framework.permissions import IsAuthenticated
from rest_framework.permissions import AllowAny
import uuid



class GuestUserCreateView(APIView):
    def post(self, request):
        user = User.objects.create(is_guest=True, username=f"guest-{uuid.uuid4()}", guest_uuid=uuid.uuid4())
        return Response({
            "id": user.id,
            "guest_uuid": str(user.guest_uuid),
            "is_guest": user.is_guest,
        }, status=status.HTTP_201_CREATED)
    
class TransactionViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user, deleted_at__isnull=True)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    serializer_class = TransactionSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_class = TransactionFilter  # <-- replaces filterset_fields
    ordering_fields = ['date', 'amount']

class PersonViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Person.objects.all().order_by('name')
    serializer_class = PersonSerializer
    def get_queryset(self):
        return Person.objects.filter(user=self.request.user, deleted_at__isnull=True)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class EventViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Event.objects.all().order_by('name')
    serializer_class = EventSerializer
    def get_queryset(self):
        return Event.objects.filter(user=self.request.user, deleted_at__isnull=True)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class SummaryView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        # Aggregate total income and expenses
        total_income = Transaction.objects.filter(user=request.user, transaction_type='income').aggregate(total=Sum('amount'))['total'] or 0
        total_expense = Transaction.objects.filter(user=request.user, transaction_type='expense').aggregate(total=Sum('amount'))['total'] or 0

        # Aggregate sums by category for income
        income_cats = Transaction.objects.filter(user=request.user, transaction_type='income').values('category').annotate(total=Sum('amount'))
        income_by_category = {item['category']: item['total'] for item in income_cats}

        # Aggregate sums by category for expense
        expense_cats = Transaction.objects.filter(user=request.user, transaction_type='expense').values('category').annotate(total=Sum('amount'))
        expense_by_category = {item['category']: item['total'] for item in expense_cats}

        data = {
            'total_income': total_income,
            'total_expense': total_expense,
            'income_by_category': income_by_category,
            'expense_by_category': expense_by_category,
        }

        serializer = SummarySerializer(data)
        return Response(serializer.data, status=status.HTTP_200_OK)

class WishlistItemViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        return WishlistItem.objects.filter(user=self.request.user, deleted_at__isnull=True)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    queryset = WishlistItem.objects.all().order_by('-updated_at')
    serializer_class = WishlistItemSerializer

    def create(self, request, *args, **kwargs):
        data = request.data.copy()

        product_url = data.get('url')
        if product_url:
            scraped = fetch_product_info(product_url)
            if scraped and 'error' not in scraped:
                data['title'] = scraped.get('title', '')
                data['price'] = str(scraped.get('price', ''))
                data['image_url'] = scraped.get('image_url', '')

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


    def update(self, request, *args, **kwargs):
        data = request.data.copy()

        product_url = data.get('url')
        if product_url:
            scraped = fetch_product_info(product_url)
            if scraped and 'error' not in scraped:
                data['title'] = scraped.get('title', '')
                data['price'] = str(scraped.get('price', ''))
                data['image_url'] = scraped.get('image_url', '')

        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        return Response(serializer.data)

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = UserSerializer