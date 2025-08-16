from django.db import models
from django.utils import timezone
from .mixins import TimestampedMixin

class Transaction(TimestampedMixin, models.Model):
    INCOME = 'income'
    EXPENSE = 'expense'
    TRANSACTION_TYPE_CHOICES = [
        (INCOME, 'Income'),
        (EXPENSE, 'Expense'),
    ]

    EXPENSE_CATEGORIES = [
        ('home_utilities', 'Home & Utilities'),
        ('transportation', 'Transportation'),
        ('food', 'Food'),
        ('health_insurance', 'Health & Insurance'),
        ('savings_debt', 'Savings & Debt'),
        ('personal_family', 'Personal & Family'),
        ('leisure', 'Leisure'),
    ]

    INCOME_CATEGORIES = [
        ('salary', 'Salary'),
        ('personal_business', 'Personal Business'),
        ('other', 'Other'),
    ]

    def default_category():
        return 'other'

    transaction_type = models.CharField(max_length=7, choices=TRANSACTION_TYPE_CHOICES, default=EXPENSE)
    category = models.CharField(max_length=50, choices=EXPENSE_CATEGORIES + INCOME_CATEGORIES, default=default_category)
    date = models.DateTimeField(default=timezone.now)
    amount = models.BigIntegerField(default=0)
    bank_account = models.CharField(max_length=100, blank=True, null=True)

    tags_people = models.ManyToManyField('Person', blank=True, related_name='transactions_by_person')
    tags_events = models.ManyToManyField('Event', blank=True, related_name='transactions_by_event')

    note = models.TextField(blank=True, null=True)
    is_recurring = models.BooleanField(default=False)
    recurrence_period = models.CharField(
        max_length=20,
        choices=[('daily', 'Daily'), ('weekly', 'Weekly'), ('monthly', 'Monthly'), ('yearly', 'Yearly')],
        blank=True,
        null=True
    )
    recurrence_end_date = models.DateField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(blank=True, null=True, help_text="Soft-delete timestamp")

    def __str__(self):
        return f"{self.transaction_type.title()} - {self.amount} Toman"

class Person(TimestampedMixin, models.Model):
    name = models.CharField(max_length=100)
    def __str__(self):
        return self.name

class Event(TimestampedMixin, models.Model):
    name = models.CharField(max_length=100)
    def __str__(self):
        return self.name

class WishlistItem(TimestampedMixin, models.Model):
    title = models.CharField(max_length=255)
    price = models.CharField(max_length=100)
    url = models.URLField()
    image_url = models.URLField(blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)
    def __str__(self):
        return self.title
