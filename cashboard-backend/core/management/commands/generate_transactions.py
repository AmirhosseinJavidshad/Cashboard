import random
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from core.models import Transaction, Person, Event

class Command(BaseCommand):
    help = 'Generate random transactions'

    def handle(self, *args, **kwargs):
        people = ['Me', 'Spouse', 'Kids']
        events = ['Emergency', 'Travel', 'Project']

        # Ensure the tags exist
        for name in people:
            Person.objects.get_or_create(name=name)
        for name in events:
            Event.objects.get_or_create(name=name)

        person_objs = list(Person.objects.all())
        event_objs = list(Event.objects.all())

        recurrence_options = ['daily', 'weekly', 'monthly', 'yearly', None]

        for _ in range(100):
            transaction_type = random.choice(['income', 'expense'])

            if transaction_type == 'income':
                category = random.choice(['salary', 'personal_business', 'other'])
            else:
                category = random.choice([
                    'home_utilities', 'transportation', 'food',
                    'health_insurance', 'savings_debt',
                    'personal_family', 'leisure'
                ])

            amount = random.randint(100_000, 5_000_000)
            days_ago = random.randint(0, 180)
            # 🔁 Full datetime, not just date
            date = timezone.now() - timedelta(days=days_ago, hours=random.randint(0, 23), minutes=random.randint(0, 59))

            # 🔁 Recurrence (25% chance)
            is_recurring = random.random() < 0.25
            recurrence_period = random.choice(recurrence_options[:-1]) if is_recurring else None
            recurrence_end_date = (
                date.date() + timedelta(days=random.randint(30, 180)) if is_recurring else None
            )

            trx = Transaction.objects.create(
                transaction_type=transaction_type,
                category=category,
                amount=amount,
                date=date,
                bank_account=random.choice(['Saman', 'Mellat', 'Tejarat']),
                note=random.choice(['', 'Monthly bill', 'Gift', 'Business', 'Trip']),
                is_recurring=is_recurring,
                recurrence_period=recurrence_period,
                recurrence_end_date=recurrence_end_date
            )

            # Random tag
            trx.tags_people.add(random.choice(person_objs))
            trx.tags_events.add(random.choice(event_objs))

        self.stdout.write(self.style.SUCCESS('✅ 100 random transactions generated.'))
