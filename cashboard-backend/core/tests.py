from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from core.models import Transaction, Person, Event

class TransactionModelTest(TestCase):
    def setUp(self):
        # Set up reusable Person and Event objects
        self.person = Person.objects.create(name="Test Person")
        self.event = Event.objects.create(name="Test Event")

    def test_basic_transaction_creation(self):
        """Test creating a basic expense transaction"""
        trx = Transaction.objects.create(
            transaction_type='expense',
            category='food',
            amount=250000,
            date=timezone.now(),
            bank_account='Mellat',
            note='Dinner with family'
        )
        trx.tags_people.add(self.person)
        trx.tags_events.add(self.event)

        self.assertEqual(trx.transaction_type, 'expense')
        self.assertEqual(trx.category, 'food')
        self.assertEqual(trx.amount, 250000)
        self.assertIn(self.person, trx.tags_people.all())
        self.assertIn(self.event, trx.tags_events.all())

    def test_recurring_transaction_fields(self):
        """Test setting recurrence fields on a transaction"""
        trx = Transaction.objects.create(
            transaction_type='income',
            category='salary',
            amount=5000000,
            date=timezone.now(),
            bank_account='Saman',
            note='Monthly salary',
            is_recurring=True,
            recurrence_period='monthly',
            recurrence_end_date=timezone.now().date() + timedelta(days=90)
        )

        self.assertTrue(trx.is_recurring)
        self.assertEqual(trx.recurrence_period, 'monthly')
        self.assertIsNotNone(trx.recurrence_end_date)

    def test_default_values(self):
        """Ensure default values are set correctly"""
        trx = Transaction.objects.create(
            transaction_type='expense',
            category='transportation',
            amount=100000,
            date=timezone.now(),
        )

        self.assertFalse(trx.is_recurring)
        self.assertIsNone(trx.recurrence_period)
        self.assertIsNone(trx.recurrence_end_date)
        self.assertIsNone(trx.bank_account)
