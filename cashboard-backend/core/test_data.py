# test_data.py
import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "cashboard.settings")
django.setup()

from core.models import User, Transaction, Person, Event, WishlistItem
from django.utils import timezone

# Sample data
user = User.objects.create_user(username="testuser", password="1234")

person1 = Person.objects.create(name="Alice", user=user)
event1 = Event.objects.create(name="Birthday", user=user)
transaction1 = Transaction.objects.create(
    transaction_type="expense",
    category="food",
    amount=50000,
    user=user
)
transaction1.tags_people.add(person1)
transaction1.tags_events.add(event1)

wishlist1 = WishlistItem.objects.create(
    title="Laptop",
    price="1000",
    url="https://example.com/laptop",
    user=user
)

print("Sample data created!")
