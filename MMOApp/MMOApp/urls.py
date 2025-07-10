from django.contrib import admin
from django.urls import path, include, re_path

from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from MMO.admin import admin_site

schema_view = get_schema_view(
    openapi.Info(
        title="MMO APIs",
        default_version='v1',
        description="APIs for MMOApp",
        contact=openapi.Contact(email="hochinguyen@gmail.com"),
        license=openapi.License(name="hochinguyen@2025"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny),
)


#truy cập stats_view bằng http://127.0.0.1:8000/admin/mmo-stats/
urlpatterns = [
    path('', include('MMO.urls')),
    path('admin/', admin_site.urls),
    re_path(r'^swagger(?P<format>\.json|\.yaml)$', schema_view.without_ui(cache_timeout=0),name='schema-json'),
    re_path(r'^swagger/$', schema_view.with_ui('swagger', cache_timeout=0),name = 'schema-swagger-ui'),
    re_path(r'^redoc/$',schema_view.with_ui('redoc', cache_timeout=0),name='schema-redoc'),
    path('o/', include('oauth2_provider.urls',namespace='oauth2_provider')),
]