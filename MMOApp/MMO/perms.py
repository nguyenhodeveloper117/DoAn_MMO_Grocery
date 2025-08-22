from rest_framework import permissions
from rest_framework.exceptions import PermissionDenied
from django.shortcuts import get_object_or_404
from MMO import models
from django.db.models import Q



class OwnerPerms(permissions.IsAuthenticated):
    def has_object_permission(self, request, view, obj):
        return super().has_object_permission(request, view, obj) and request.user == obj


class BlogOwnerPerms(permissions.IsAuthenticated):
    def has_object_permission(self, request, view, obj):
        return obj.author == request.user


class IsSeller(permissions.IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.role == 'seller' and request.user.is_verified

    def has_object_permission(self, request, view, obj):
        return obj.seller == request.user


class IsSellerStock(permissions.IsAuthenticated):
    def has_object_permission(self, request, view, obj):
        return super().has_object_permission(request, view, obj) and obj.product.store.seller == request.user


class IsSellerProduct(permissions.IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.role == 'seller' and request.user.is_verified

    def has_object_permission(self, request, view, obj):
        return obj.store.seller == request.user


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


class CanUpdate(permissions.IsAuthenticated):
    def has_permission(self, request, view):
        # Đảm bảo người dùng đăng nhập trước
        if not super().has_permission(request, view):
            return False

        order_code = view.kwargs.get('pk')
        if not order_code:
            return False

        order = get_object_or_404(models.Order, pk=order_code, active=True)

        # Kiểm tra quyền sở hữu: phải là buyer hoặc seller của sản phẩm trong order
        is_buyer = order.buyer == request.user
        is_seller = (
                (hasattr(order,
                         'acc_detail') and order.acc_detail.product and order.acc_detail.product.store.seller == request.user) or
                (hasattr(order,
                         'service_detail') and order.service_detail.product and order.service_detail.product.store.seller == request.user)
        )

        if not (is_buyer or is_seller):
            raise PermissionDenied("Bạn không có quyền huỷ đơn này.")

        # lấy action từ client
        action = request.data.get("action")

        if action == "cancel":
            if order.status != "processing":
                raise PermissionDenied("Chỉ có thể huỷ đơn khi đang xử lý.")
            if hasattr(order, "service_detail") and order.service_detail:
                if order.service_detail.status != "pending":
                    raise PermissionDenied("Chỉ có thể huỷ dịch vụ khi đang chờ chấp nhận.")

        elif action == "accept":  # cập nhật sang in_progress
            if order.status != "processing":
                raise PermissionDenied("Đơn phải ở trạng thái processing mới có thể chấp nhận.")
            if hasattr(order, "service_detail") and order.service_detail:
                if order.service_detail.status != "pending":
                    raise PermissionDenied("Dịch vụ phải pending mới được chấp nhận.")

        elif action == "complete":  # cập nhật sang completed
            if order.status != "processing":
                raise PermissionDenied("Đơn phải ở trạng thái processing mới có thể hoàn thành.")
            if hasattr(order, "service_detail") and order.service_detail:
                if order.service_detail.status != "in_progress":
                    raise PermissionDenied("Dịch vụ phải in_progress mới được hoàn thành.")

        else:
            raise PermissionDenied("Hành động không hợp lệ.")

        return True


class IsOrderOwner(permissions.IsAuthenticated):
    def has_object_permission(self, request, view, obj):
        return obj.buyer == request.user


class IsSellerOrder(permissions.IsAuthenticated):
    def has_object_permission(self, request, view, obj):
        return (
                (hasattr(obj, 'acc_detail') and obj.acc_detail.product.seller == request.user) or
                (hasattr(obj, 'service_detail') and obj.service_detail.product.seller == request.user)
        )


class IsOrderOwnerOrSeller(permissions.IsAuthenticated):
    def has_object_permission(self, request, view, obj):
        user = request.user
        is_buyer = obj.order.buyer == user
        is_seller = obj.product and obj.product.store.seller == user

        # Cho phép buyer hoặc seller truy cập (GET, PATCH, PUT, DELETE)
        return is_buyer or is_seller

class IsOrderOrSeller(permissions.IsAuthenticated):
    def has_object_permission(self, request, view, obj):
        # buyer
        if obj.buyer == request.user:
            return True

        # seller: lấy product trong acc_detail hoặc service_detail
        product = None
        if hasattr(obj, "acc_detail") and obj.acc_detail.product:
            product = obj.acc_detail.product
        elif hasattr(obj, "service_detail") and obj.service_detail.product:
            product = obj.service_detail.product

        if product and product.store.seller == request.user:
            return True

        return False

class CanPostOrderDetail(permissions.IsAuthenticated):
    def has_permission(self, request, view):
        order_id = request.data.get('order')
        if not order_id:
            return False  # Không có order_id trong body => từ chối
        try:
            order = models.Order.objects.get(pk=order_id, buyer=request.user)
        except models.Order.DoesNotExist:
            return False

        return True


class CanReviewProduct(permissions.IsAuthenticated):
    def has_permission(self, request, view):
        product_code = request.data.get("product_code")
        order_code = request.data.get("order_code")

        if not product_code or not order_code:
            return False

        user = request.user

        # Lấy order cụ thể
        try:
            order = models.Order.objects.get(order_code=order_code, buyer=user, active=True)
        except models.Order.DoesNotExist:
            return False

        # Kiểm tra order này có mua sản phẩm này không
        has_product = (
                (hasattr(order, 'acc_detail') and order.acc_detail.product.product_code == product_code) or
                (hasattr(order, 'service_detail') and order.service_detail.product.product_code == product_code)
        )

        if not has_product:
            return False

        # Kiểm tra order này đã review sản phẩm này chưa
        already_reviewed = models.Review.objects.filter(
            buyer=user,
            product__product_code=product_code,
            order=order
        ).exists()

        return not already_reviewed
