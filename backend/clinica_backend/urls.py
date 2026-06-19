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
from django.http import FileResponse, HttpResponseNotFound, Http404
from django.views.static import serve
import os

FRONTEND_DIST = os.path.join(settings.BASE_DIR.parent, 'frontend', 'dist')

def frontend_spa(request):
    """Sirve archivos estáticos compilados si existen, o index.html como fallback SPA."""
    path = request.path.lstrip('/')
    if not path:
        path = 'index.html'
        
    file_path = os.path.join(FRONTEND_DIST, path)
    if os.path.exists(file_path) and os.path.isfile(file_path):
        try:
            return serve(request, path, document_root=FRONTEND_DIST)
        except Http404:
            pass
            
    # Fallback para rutas React Router SPA
    return serve(request, 'index.html', document_root=FRONTEND_DIST)

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
