from django.urls import re_path
from . import consumers, consumers_simple

websocket_urlpatterns = [
    re_path(r'ws/checkins/$', consumers.CheckinConsumer.as_asgi()),
    re_path(r'ws/test/$', consumers_simple.SimpleConsumer.as_asgi()),
]
