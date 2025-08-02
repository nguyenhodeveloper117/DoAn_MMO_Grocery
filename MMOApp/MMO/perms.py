from rest_framework import permissions
from rest_framework.permissions import BasePermission
from rest_framework.exceptions import ValidationError
from .models import *

class OwnerPerms(permissions.IsAuthenticated):
    def has_object_permission(self, request, view, obj):
        return super().has_object_permission(request, view, obj) and request.user == obj

class IsSeller(permissions.IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.role == 'seller' and request.user.is_verified

    def has_object_permission(self, request, view, obj):
        return obj.seller == request.user

class IsVerificationOwner(permissions.BasePermission):
    def has_permission(self, request, view):
        # Cho phép truy cập nếu user đã đăng nhập
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # Chỉ cho phép nếu verification.user là user hiện tại
        return obj.user == request.user

class IsVerified(permissions.IsAuthenticated):
    # Chỉ cho phép người dùng đã xác thực (is_verified == True)
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.role == 'customer' and request.user.is_verified