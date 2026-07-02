from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from .views import (
    UserViewSet, PatientViewSet, CheckinViewSet, TicketViewSet,
    SliderViewSet, VoiceViewSet, list_specialists, CurrentUserView,
    text_to_speech, shutdown_server,
)

# Crear router para viewsets
router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'patients', PatientViewSet, basename='patient')
router.register(r'checkins', CheckinViewSet, basename='checkin')
router.register(r'tickets', TicketViewSet, basename='ticket')
router.register(r'sliders', SliderViewSet, basename='slider')
router.register(r'voices', VoiceViewSet, basename='voice')

urlpatterns = [
    # Router URLs
    path('', include(router.urls)),
    
    # Autenticación JWT
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/me/', CurrentUserView.as_view(), name='current_user'),
    
    # Endpoints públicos para el kiosko
    path('specialists/', list_specialists, name='list_specialists'),
    path('tts/', text_to_speech, name='text_to_speech'),
    path('system/shutdown/', shutdown_server, name='shutdown_server'),
]