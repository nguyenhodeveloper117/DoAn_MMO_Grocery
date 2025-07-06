from rest_framework import permissions
from rest_framework.permissions import BasePermission
from rest_framework.exceptions import ValidationError
from .models import *

class OwnerPerms(permissions.IsAuthenticated):
    def has_object_permission(self, request, view, obj):
        return super().has_object_permission(request, view, obj) and request.user == obj