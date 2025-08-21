import csv

from django.contrib import admin
from django.http import HttpResponse

from .models import *
from django.template.response import TemplateResponse
from django.urls import path
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

@admin.action(description="Xuất CSV Acc Order")
def export_to_csv_acc(modeladmin, request, queryset):
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="acc_order_details.csv"'

    writer = csv.writer(response)
    # Header
    writer.writerow(['Mã', 'Sản phẩm', 'Số lượng', 'Giá', 'Tổng tiền', 'Giao cho'])

    for obj in queryset:
        writer.writerow([
            obj.acc_order_detail_code,
            obj.product.name if obj.product else '',
            obj.quantity,
            obj.unit_price,
            obj.total_amount,
            obj.content_delivered
        ])
    return response

@admin.action(description="Xuất CSV Service Order")
def export_to_csv_service(modeladmin, request, queryset):
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="service_order_details.csv"'

    writer = csv.writer(response)
    writer.writerow(['Mã đơn dịch vụ', 'Sản phẩm', 'Số lượng', 'Giá', 'Tổng tiền', 'Trạng thái', 'Link giao hàng', 'Ghi chú'])

    for obj in queryset:
        writer.writerow([
            obj.service_order_detail_code,
            obj.product.name if obj.product else '',
            obj.quantity,
            obj.unit_price,
            obj.total_amount,
            obj.status,
            obj.target_url,
            obj.note or ''
        ])

    return response


# User
class UserAdmin(admin.ModelAdmin):
    list_display = ['user_code', 'username', 'first_name', 'last_name', 'balance', 'email', 'role', 'is_verified',
                    'is_superuser' ,'is_staff', 'is_active', 'date_joined', 'last_login', 'avatar_display']
    list_filter = ['role', 'is_staff', 'is_active']
    search_fields = ['username', 'first_name', 'last_name', 'email']
    ordering = ['-date_joined']
    readonly_fields = ['avatar_display']

    def avatar_display(self, obj):
        if obj.avatar:
            return mark_safe(f"<img src='{obj.avatar.url}' width='80' />")

    def save_model(self, request, obj, form, change):
        if not change or 'password' in form.changed_data:
            obj.set_password(obj.password)
        super().save_model(request, obj, form, change)

# Verification
class VerificationAdmin(admin.ModelAdmin):
    list_display = ['verification_code', 'user', 'cccd', 'front_id_image', 'back_id_image', 'portrait_image', 'status',
                    'active', 'created_date', 'updated_date']
    search_fields = ['verification_code', 'user__username']
    list_filter = ['status']
    readonly_fields = ['front_id_image', 'back_id_image', 'portrait_image']

    def front_id_image(self, obj):
        if obj.front_id:
            return mark_safe(f"<img src='{obj.front_id.url}' width='80' />")

    def back_id_image(self, obj):
        if obj.back_id:
            return mark_safe(f"<img src='{obj.back_id.url}' width='80' />")

    def portrait_image(self, obj):
        if obj.portrait:
            return mark_safe(f"<img src='{obj.portrait.url}' width='80' />")

# Store
class StoreAdmin(admin.ModelAdmin):
    list_display = ['store_code', 'name', 'seller', 'active', 'created_date', 'updated_date']
    search_fields = ['name', 'seller__username']
    list_filter = ['created_date']

# Product
class ProductAdmin(admin.ModelAdmin):
    list_display = ['product_code', 'name', 'store', 'type', 'price', 'available_quantity', 'is_approved',
                    'active', 'created_date', 'updated_date', 'image_display']
    search_fields = ['name', 'store__name']
    list_filter = ['type', 'is_approved']

    readonly_fields = ['image_display']

    def image_display(self, obj):
        if obj.image:
            return mark_safe(f"<img src='{obj.image.url}' width='80' />")

class AccountStockAdmin(admin.ModelAdmin):
    list_display = ['stock_code', 'product', 'is_sold', 'sold_at', 'active', 'created_date', 'updated_date']
    list_filter = ['is_sold', 'product']
    search_fields = ['stock_code', 'product__name', 'content']
    readonly_fields = ['stock_code', 'sold_at', 'created_date', 'updated_date']
    list_per_page = 20


# Voucher
class VoucherAdmin(admin.ModelAdmin):
    list_display = ['voucher_code', 'code', 'store', 'discount_percent', 'max_discount', 'expired_at', 'quantity',
                    'active', 'created_date', 'updated_date']
    search_fields = ['code', 'store__name']
    list_filter = ['expired_at']

# Order
class OrderAdmin(admin.ModelAdmin):
    list_display = ['order_code', 'buyer', 'is_paid', "voucher", 'status', 'released_at', 'active', 'created_date', 'updated_date']
    search_fields = ['order_code', 'buyer__username']
    list_filter = ['status', 'is_paid']


# AccOrderDetail
class AccOrderDetailAdmin(admin.ModelAdmin):
    list_display = ['acc_order_detail_code', 'order', 'product', 'unit_price', 'quantity', 'total_amount', 'discount_amount', 'content_delivered',
                    'active', 'created_date', 'updated_date']
    search_fields = ['order__order_code', 'product__name']
    readonly_fields = ['total_amount', 'unit_price']
    actions = [export_to_csv_acc]

class ServiceOrderDetailAdmin(admin.ModelAdmin):
    list_display = ['service_order_detail_code', 'order', 'product', 'target_url', 'unit_price', 'quantity', 'status', 'total_amount', 'discount_amount',
                    'active', 'created_date', 'updated_date']
    search_fields = ['order__order_code', 'product__name', 'target_url']
    list_filter = ['status']
    readonly_fields = ['total_amount', 'unit_price']
    actions = [export_to_csv_service]

# Complaint
class ComplaintAdmin(admin.ModelAdmin):
    list_display = ['complaint_code', 'order', 'buyer', 'message', 'resolved', 'decision', 'admin',
                    'active','created_date', 'updated_date', 'image_display1', 'image_display2', 'image_display3', 'video_display']
    search_fields = ['order__order_code', 'buyer__username']
    list_filter = ['resolved', 'decision']
    readonly_fields = ['image_display1', 'image_display2', 'image_display3', 'video_display']

    def image_display1(self, obj):
        if obj.evidence_image1:
            return mark_safe(f"<img src='{obj.evidence_image1.url}' width='80' />")

    def image_display2(self, obj):
        if obj.evidence_image2:
            return mark_safe(f"<img src='{obj.evidence_image2.url}' width='80' />")

    def image_display3(self, obj):
        if obj.evidence_image3:
            return mark_safe(f"<img src='{obj.evidence_image3.url}' width='80' />")

    def video_display(self, obj):
        if obj.evidence_video:
            return mark_safe(f"<img src='{obj.evidence_video.url}' width='80' />")


# Review
class ReviewAdmin(admin.ModelAdmin):
    list_display = ['review_code', 'product', 'order', 'buyer', 'rating', 'active', 'created_date', 'updated_date']
    search_fields = ['product__name', 'buyer__username']


# Blog
class BlogAdmin(admin.ModelAdmin):
    list_display = ['blog_code', 'title', 'author', 'category', 'active', 'created_date', 'updated_date']
    search_fields = ['title', 'author__username', 'category']


# BlogComment
class BlogCommentAdmin(admin.ModelAdmin):
    list_display = ['blog_comment_code', 'blog', 'author', 'active', 'created_date', 'updated_date']
    search_fields = ['blog__title', 'author__username']

# Blog Like
class BlogLikeAdmin(admin.ModelAdmin):
    list_display = ['blog_like_code', 'blog', 'user', 'active', 'created_date', 'updated_date']
    search_fields = ['blog__title', 'user__username']

# TransactionHistory
class TransactionHistoryAdmin(admin.ModelAdmin):
    list_display = ['transaction_code', 'user', 'type', 'amount', 'active', 'created_date', 'updated_date']
    search_fields = ['user__username']
    list_filter = ['type']


# FavoriteProduct
class FavoriteProductAdmin(admin.ModelAdmin):
    list_display = ['favorite_code', 'user', 'product', 'active', 'created_date', 'updated_date']
    search_fields = ['user__username', 'product__name']


# Custom Admin site
admin_site = MyAdminSite(name='admin')

# Đăng ký với custom Admin model
admin_site.register(User, UserAdmin)
admin_site.register(Verification, VerificationAdmin)
admin_site.register(Store, StoreAdmin)
admin_site.register(Product, ProductAdmin)
admin_site.register(AccountStock, AccountStockAdmin)
admin_site.register(Voucher, VoucherAdmin)
admin_site.register(Order, OrderAdmin)
admin_site.register(AccOrderDetail, AccOrderDetailAdmin)
admin_site.register(ServiceOrderDetail, ServiceOrderDetailAdmin)
admin_site.register(Complaint, ComplaintAdmin)
admin_site.register(Review, ReviewAdmin)
admin_site.register(Blog, BlogAdmin)
admin_site.register(BlogLike, BlogLikeAdmin)
admin_site.register(BlogComment, BlogCommentAdmin)
admin_site.register(TransactionHistory, TransactionHistoryAdmin)
admin_site.register(FavoriteProduct, FavoriteProductAdmin)

# OAuth2
admin_site.register(AccessToken)
admin_site.register(Application)
admin_site.register(RefreshToken)
admin_site.register(Grant)
admin_site.register(IDToken)
