"""
URL configuration for clinica_backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.http import FileResponse, HttpResponseNotFound
from django.views.static import serve
import os

FRONTEND_DIST = os.path.join(settings.BASE_DIR.parent, 'frontend', 'dist')

def frontend_spa(request):
    """Sirve el index.html del frontend para rutas SPA."""
    index_path = os.path.join(FRONTEND_DIST, 'index.html')
    if os.path.exists(index_path):
        return FileResponse(open(index_path, 'rb'), content_type='text/html')
    return HttpResponseNotFound('Frontend build not found. Run `npm run build` in the frontend directory.')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    # Servir assets del frontend build
    path('assets/<path:path>', serve, {'document_root': os.path.join(FRONTEND_DIST)}),
]

# Servir archivos de media (siempre, no solo en DEBUG)
urlpatterns += [
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
]

# Catch-all para el frontend SPA (React Router)
urlpatterns += [
    re_path(r'^(?!api/|admin/|media/|assets/).*', frontend_spa),
]
