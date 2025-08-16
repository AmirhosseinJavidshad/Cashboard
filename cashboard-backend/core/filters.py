from django_filters import rest_framework as filters
from .models import Transaction, Person, Event

class TransactionFilter(filters.FilterSet):
    person = filters.ModelMultipleChoiceFilter(
        field_name='tags_people__id',
        to_field_name='id',
        queryset=Person.objects.all()
    )
    event = filters.ModelMultipleChoiceFilter(
        field_name='tags_events__id',
        to_field_name='id',
        queryset=Event.objects.all()
    )

    class Meta:
        model = Transaction
        fields = {
            'transaction_type': ['exact'],
            'category': ['exact'],
            'date': ['gte', 'lte'],
            'bank_account': ['exact'],
        }
