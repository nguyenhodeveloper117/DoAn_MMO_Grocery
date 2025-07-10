from django.contrib import admin
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

# User
class UserAdmin(admin.ModelAdmin):
    list_display = ['user_code', 'username', 'first_name', 'last_name', 'email', 'role', 'is_staff', 'is_active', 'date_joined', 'avatar_display']
    list_filter = ['role', 'is_staff', 'is_active']
    search_fields = ['username', 'first_name', 'last_name', 'email']
    ordering = ['-date_joined']
    readonly_fields = ['avatar_display']

    def avatar_display(self, obj):
        if obj.avatar:
            return mark_safe(f"<img src='{obj.avatar.url}' width='80' />")


# Store
class StoreAdmin(admin.ModelAdmin):
    list_display = ['store_code', 'name', 'seller', 'verified', 'created_date']
    search_fields = ['name', 'seller__username']
    list_filter = ['verified']


# Product
class ProductAdmin(admin.ModelAdmin):
    list_display = ['product_code', 'name', 'store', 'type', 'price', 'available_quantity', 'is_approved', 'image_display']
    search_fields = ['name', 'store__name']
    list_filter = ['type', 'is_approved']

    readonly_fields = ['image_display']

    def image_display(self, obj):
        if obj.image:
            return mark_safe(f"<img src='{obj.image.url}' width='80' />")

class AccountStockAdmin(admin.ModelAdmin):
    list_display = ['stock_code', 'product', 'is_sold', 'sold_at', 'created_date']
    list_filter = ['is_sold', 'product']
    search_fields = ['stock_code', 'product__name', 'content']
    readonly_fields = ['stock_code', 'sold_at', 'created_date', 'updated_date']
    list_per_page = 20


# Voucher
class VoucherAdmin(admin.ModelAdmin):
    list_display = ['voucher_code', 'code', 'store', 'discount_percent', 'expired_at', 'quantity']
    search_fields = ['code', 'store__name']
    list_filter = ['expired_at']


# Order
class OrderAdmin(admin.ModelAdmin):
    list_display = ['order_code', 'buyer', 'is_paid', "voucher", "discount_amount", "total_amount", 'status', 'released_at']
    search_fields = ['order_code', 'buyer__username']
    list_filter = ['status', 'is_paid']


# AccOrderDetail
class AccOrderDetailAdmin(admin.ModelAdmin):
    list_display = ['acc_order_detail_code', 'order', 'product', 'quantity']
    search_fields = ['order__order_code', 'product__name']

class ServiceOrderDetailAdmin(admin.ModelAdmin):
    list_display = ['service_order_detail_code', 'order', 'product', 'target_url', 'quantity', 'status']
    search_fields = ['order__order_code', 'product__name', 'target_url']
    list_filter = ['status']

# Complaint
class ComplaintAdmin(admin.ModelAdmin):
    list_display = ['complaint_code', 'order', 'buyer', 'resolved', 'decision', 'admin']
    search_fields = ['order__order_code', 'buyer__username']
    list_filter = ['resolved', 'decision']


# Review
class ReviewAdmin(admin.ModelAdmin):
    list_display = ['review_code', 'product', 'buyer', 'rating']
    search_fields = ['product__name', 'buyer__username']


# Blog
class BlogAdmin(admin.ModelAdmin):
    list_display = ['blog_code', 'title', 'author', 'category', 'created_at']
    search_fields = ['title', 'author__username', 'category']


# BlogComment
class BlogCommentAdmin(admin.ModelAdmin):
    list_display = ['blog_comment_code', 'blog', 'author', 'created_date']
    search_fields = ['blog__title', 'author__username']


# TransactionHistory
class TransactionHistoryAdmin(admin.ModelAdmin):
    list_display = ['transaction_code', 'user', 'type', 'amount', 'created_date']
    search_fields = ['user__username']
    list_filter = ['type']


# FavoriteProduct
class FavoriteProductAdmin(admin.ModelAdmin):
    list_display = ['favorite_code', 'user', 'product']
    search_fields = ['user__username', 'product__name']


# Custom Admin site
admin_site = MyAdminSite(name='admin')

# Đăng ký với custom Admin model
admin_site.register(User, UserAdmin)
admin_site.register(Store, StoreAdmin)
admin_site.register(Product, ProductAdmin)
admin_site.register(AccountStock, AccountStockAdmin)
admin_site.register(Voucher, VoucherAdmin)
admin_site.register(Order, OrderAdmin)
admin_site.register(AccOrderDetail, AccOrderDetailAdmin)
admin_site.register(Complaint, ComplaintAdmin)
admin_site.register(Review, ReviewAdmin)
admin_site.register(Blog, BlogAdmin)
admin_site.register(BlogComment, BlogCommentAdmin)
admin_site.register(TransactionHistory, TransactionHistoryAdmin)
admin_site.register(FavoriteProduct, FavoriteProductAdmin)

# OAuth2
admin_site.register(AccessToken)
admin_site.register(Application)
admin_site.register(RefreshToken)
admin_site.register(Grant)
admin_site.register(IDToken)
