from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from .views import (
    UserViewSet, PatientViewSet, CheckinViewSet, TicketViewSet,
    SliderViewSet, list_specialists, KioskCheckinView, CurrentUserView
)

# Crear router para viewsets
router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'patients', PatientViewSet, basename='patient')
router.register(r'checkins', CheckinViewSet, basename='checkin')
router.register(r'tickets', TicketViewSet, basename='ticket')
router.register(r'sliders', SliderViewSet, basename='slider')

urlpatterns = [
    # Router URLs
    path('', include(router.urls)),
    
    # Autenticación JWT
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/me/', CurrentUserView.as_view(), name='current_user'),
    
    # Endpoints públicos para el kiosko
    path('specialists/', list_specialists, name='list_specialists'),
    path('kiosk/checkin/', KioskCheckinView.as_view(), name='kiosk_checkin'),
]