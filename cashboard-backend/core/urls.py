from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TransactionViewSet,
    PersonViewSet,
    EventViewSet,
    SummaryView,
    WishlistItemViewSet,
    RegisterView   # ✅ import register view
)
from core.views_src.sync import SyncPushView, SyncPullView

router = DefaultRouter()
router.register(r'transactions', TransactionViewSet, basename='transaction')
router.register(r'people', PersonViewSet, basename='person')
router.register(r'events', EventViewSet, basename='event')
router.register(r'wishlistitems', WishlistItemViewSet, basename='wishlistitem')

urlpatterns = [
    path('', include(router.urls)),
    path('summary/', SummaryView.as_view(), name='summary'),

    # ✅ registration endpoint
    path('register/', RegisterView.as_view(), name='register'),

    # ---------------- Sync endpoints ----------------
    path('sync/push/', SyncPushView.as_view(), name='sync-push'),
    path('sync/pull/', SyncPullView.as_view(), name='sync-pull'),
]
