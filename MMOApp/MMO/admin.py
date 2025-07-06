from django.contrib import admin
from .models import *
from django.db.models import Count
from django.template.response import TemplateResponse
from django.urls import path
from django.utils import timezone
from datetime import timedelta, datetime
from django.utils.html import mark_safe
from oauth2_provider.models import AccessToken, Application, RefreshToken, Grant, IDToken


class MyAdminSite(admin.AdminSite):
    site_header = 'MMO App'

    def get_urls(self):
        return [
            path('mmo-stats/', self.stats_view, name='mmo-stats')
        ] + super().get_urls()

    def stats_view(self, request):
        return TemplateResponse(request, 'admin/stats_view.html')

class UserAdmin(admin.ModelAdmin):
    list_display = ['id', 'username', 'first_name', 'last_name', 'password','email', 'role', 'is_staff', 'is_active', 'date_joined', 'avatar']
    list_filter = ['role', 'is_staff', 'is_active']
    search_fields = ['username', 'first_name', 'last_name', 'email']
    ordering = ['-date_joined']
    readonly_fields = ['avatar_display']

    def avatar_display(self, obj):
        if obj.avatar:
            return mark_safe(f"<img src='{obj.avatar.url}' width='120' />")

admin_site = MyAdminSite(name='admin')

admin_site.register(User, UserAdmin)
admin_site.register(AccessToken)
admin_site.register(Application)
admin_site.register(RefreshToken)
admin_site.register(Grant)
admin_site.register(IDToken)
