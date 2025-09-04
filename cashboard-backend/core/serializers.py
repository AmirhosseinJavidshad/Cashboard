from rest_framework import serializers
from .models import Transaction, Person, Event, WishlistItem, User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "is_guest", "guest_uuid"]
        
# ---------------- Transaction ----------------
class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = '__all__'  # includes all fields including client_uuid, deleted_at, user

    def validate(self, data):
        transaction_type = data.get('transaction_type')
        category = data.get('category')
        amount = data.get('amount')
        bank_account = data.get('bank_account')

        expense_categories = [choice[0] for choice in Transaction.EXPENSE_CATEGORIES]
        income_categories = [choice[0] for choice in Transaction.INCOME_CATEGORIES]

        # 1. Category must match transaction type
        if transaction_type == Transaction.EXPENSE and category not in expense_categories:
            raise serializers.ValidationError(
                "Category must be an expense category for expense transactions."
            )
        if transaction_type == Transaction.INCOME and category not in income_categories:
            raise serializers.ValidationError(
                "Category must be an income category for income transactions."
            )

        # 2. Amount must be greater than zero
        if amount <= 0:
            raise serializers.ValidationError("Amount must be greater than zero.")

        # 3. Bank account should not be purely numeric (optional)
        if bank_account and bank_account.isdigit():
            raise serializers.ValidationError(
                "Bank account name must not be only digits."
            )

        return data

# ---------------- Person ----------------
class PersonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Person
        fields = ['id', 'name', 'client_uuid', 'deleted_at', 'user']

# ---------------- Event ----------------
class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = ['id', 'name', 'client_uuid', 'deleted_at', 'user']

# ---------------- Summary ----------------
class SummarySerializer(serializers.Serializer):
    total_income = serializers.IntegerField()
    total_expense = serializers.IntegerField()
    income_by_category = serializers.DictField(child=serializers.IntegerField())
    expense_by_category = serializers.DictField(child=serializers.IntegerField())

# ---------------- WishlistItem ----------------
class WishlistItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = WishlistItem
        fields = [
            'id',
            'url',
            'title',
            'price',
            'image_url',
            'updated_at',
            'client_uuid',
            'deleted_at',
            'user',
        ]
