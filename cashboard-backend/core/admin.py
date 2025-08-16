from django.contrib import admin
from .models import Transaction
from .models import WishlistItem

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('transaction_type', 'amount', 'category', 'date', 'is_recurring', 'recurrence_period')
    list_filter = ('transaction_type', 'category', 'is_recurring')


admin.site.register(WishlistItem)
