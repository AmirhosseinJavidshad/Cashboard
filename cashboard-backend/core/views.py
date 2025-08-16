from rest_framework import viewsets, filters, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .filters import TransactionFilter
from django.db.models import Sum
from .models import Transaction, Person, Event, WishlistItem
from .serializers import TransactionSerializer, PersonSerializer, EventSerializer, SummarySerializer, WishlistItemSerializer
from core.utils.digikala_scraper import fetch_product_info  # adjust path as needed


class TransactionViewSet(viewsets.ModelViewSet):
    queryset = Transaction.objects.all().order_by('-date')
    serializer_class = TransactionSerializer
    def get_queryset(self):
        # Exclude soft-deleted transactions by default
        return Transaction.objects.filter(deleted_at__isnull=True)
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_class = TransactionFilter  # <-- replaces filterset_fields
    ordering_fields = ['date', 'amount']

class PersonViewSet(viewsets.ModelViewSet):
    queryset = Person.objects.all().order_by('name')
    serializer_class = PersonSerializer

class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all().order_by('name')
    serializer_class = EventSerializer

class SummaryView(APIView):
    def get(self, request):
        # Aggregate total income and expenses
        total_income = Transaction.objects.filter(transaction_type='income').aggregate(total=Sum('amount'))['total'] or 0
        total_expense = Transaction.objects.filter(transaction_type='expense').aggregate(total=Sum('amount'))['total'] or 0

        # Aggregate sums by category for income
        income_cats = Transaction.objects.filter(transaction_type='income').values('category').annotate(total=Sum('amount'))
        income_by_category = {item['category']: item['total'] for item in income_cats}

        # Aggregate sums by category for expense
        expense_cats = Transaction.objects.filter(transaction_type='expense').values('category').annotate(total=Sum('amount'))
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
