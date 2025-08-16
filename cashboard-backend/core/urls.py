from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TransactionViewSet,
    PersonViewSet,
    EventViewSet,
    SummaryView,
    WishlistItemViewSet
)
from core.views_src.sync import SyncPushView, SyncPullView

router = DefaultRouter()
router.register(r'transactions', TransactionViewSet)
router.register(r'people', PersonViewSet)
router.register(r'events', EventViewSet)
router.register(r'wishlistitems', WishlistItemViewSet)  # <-- existing line

urlpatterns = [
    path('', include(router.urls)),
    path('summary/', SummaryView.as_view(), name='summary'),

    # ---------------- Sync endpoints ----------------
    path('sync/push/', SyncPushView.as_view(), name='sync-push'),
    path('sync/pull/', SyncPullView.as_view(), name='sync-pull'),
]
