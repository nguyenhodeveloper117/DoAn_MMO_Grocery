import csv
from django.contrib import admin
from django.http import HttpResponse
from .models import *
from django.template.response import TemplateResponse
from django.urls import path
from django.utils.html import mark_safe
from oauth2_provider.models import AccessToken, Application, RefreshToken, Grant, IDToken
from datetime import datetime, timedelta
from django.db.models import Avg, Count, Q, F, ExpressionWrapper, DurationField
from django.db.models.functions import TruncDate
from django.utils import timezone
from django.utils.dateparse import parse_date
from django.db.models import Sum


class MyAdminSite(admin.AdminSite):
    site_header = 'MMO App'

    def get_urls(self):
        return [
            path('mmo-stats/', self.stats_view, name='mmo-stats')
        ] + super().get_urls()

    def _parse_range(self, request):
        # Đọc khoảng ngày từ querystring (?from=YYYY-MM-DD&to=YYYY-MM-DD). Mặc định 30 ngày gần nhất
        now = timezone.now()
        default_start = (now - timedelta(days=30)).date()
        default_end = now.date()

        from_str = request.GET.get('from')
        to_str = request.GET.get('to')

        start_date = parse_date(from_str) if from_str else default_start
        end_date = parse_date(to_str) if to_str else default_end

        # Chuyển về datetime có tz, set đầu/ngày cuối
        start_dt = timezone.make_aware(datetime.combine(start_date, datetime.min.time()))
        end_dt = timezone.make_aware(datetime.combine(end_date, datetime.max.time()))
        return start_dt, end_dt

    def stats_view(self, request):
        from .models import Store, Order, Review, Complaint  # tránh import vòng

        store_code = (request.GET.get('store_code') or 'ST00001').strip()
        start_dt, end_dt = self._parse_range(request)

        store = None
        orders_qs = Order.objects.none()
        reviews_qs = Review.objects.none()
        complaints_qs = Complaint.objects.none()

        if store_code:
            try:
                store = Store.objects.get(pk=store_code)

                # Đơn hàng thuộc store (qua acc_detail hoặc service_detail)
                orders_qs = (
                    Order.objects.filter(
                        Q(acc_detail__product__store=store) | Q(service_detail__product__store=store),
                        created_date__range=(start_dt, end_dt)
                    )
                    .distinct()
                )

                # Đánh giá thuộc store trong khoảng thời gian (lọc theo thời gian tạo review)
                reviews_qs = Review.objects.filter(
                    product__store=store,
                    created_date__range=(start_dt, end_dt)
                )

                # Khiếu nại thuộc các đơn của store trong khoảng thời gian
                complaints_qs = Complaint.objects.filter(
                    order__in=orders_qs,
                    created_date__range=(start_dt, end_dt)
                )

            except Store.DoesNotExist:
                store = None

        # TÍNH TOÁN CHỈ SỐ
        total_orders = orders_qs.count()
        completed_orders = orders_qs.filter(status__in=['delivered', 'completed']).count()
        refunded_orders = orders_qs.filter(status='refunded').count()
        complained_orders = complaints_qs.values('order').distinct().count()

        avg_rating = reviews_qs.aggregate(v=Avg('rating'))['v'] or 0

        # Tỉ lệ
        def safe_rate(n, d):
            return float(n) / float(d) if d else 0.0

        complaint_rate = safe_rate(complained_orders, total_orders)
        refund_rate = safe_rate(refunded_orders, total_orders)
        fulfill_rate = safe_rate(completed_orders, total_orders)

        # Thời gian giao hàng trung bình (nếu có released_at). Dùng đơn vị giờ.
        delivered_qs = orders_qs.filter(released_at__isnull=False)
        if delivered_qs.exists():
            avg_delta = delivered_qs.annotate(
                diff=ExpressionWrapper(F('released_at') - F('created_date'), output_field=DurationField())
            ).aggregate(v=Avg('diff'))['v']
            avg_delivery_hours = round(avg_delta.total_seconds() / 3600.0, 2) if avg_delta else None
        else:
            avg_delivery_hours = None

        # Điểm uy tín (0-100):
        # 70% theo điểm trung bình đánh giá, 15% theo (1 - complaint_rate), 15% theo (1 - refund_rate)
        score = (avg_rating / 5.0) * 70.0 + (1.0 - complaint_rate) * 15.0 + (1.0 - refund_rate) * 15.0
        score = max(0.0, min(100.0, round(score, 2)))

        from datetime import timedelta  # đảm bảo import ở đầu file

        # Group theo ngày (nhóm kết quả)
        orders_grouped = (
            orders_qs.annotate(day=TruncDate('created_date'))
            .values('day')
            .annotate(cnt=Count('order_code'))
            .order_by('day')
        )
        ratings_grouped = (
            reviews_qs.annotate(day=TruncDate('created_date'))
            .values('day')
            .annotate(avg=Avg('rating'))
            .order_by('day')
        )

        # Map kết quả theo key 'DD/MM/YYYY' để lookup dễ dàng
        orders_map = {o['day'].strftime('%d/%m/%Y'): o['cnt'] for o in orders_grouped}
        ratings_map = {r['day'].strftime('%d/%m/%Y'): float(r['avg'] or 0) for r in ratings_grouped}

        # Lặp qua full range start_dt.date() -> end_dt.date()
        start_date = start_dt.date()
        end_date = end_dt.date()

        labels = []
        order_counts = []
        rating_values = []

        cur = start_date
        while cur <= end_date:
            lookup_key = cur.strftime('%d/%m/%Y')  # dùng cho map
            labels.append(cur.strftime('%d/%m'))  # hiển thị dd/mm (bỏ năm)
            order_counts.append(orders_map.get(lookup_key, 0))
            rating_values.append(round(ratings_map.get(lookup_key, 0.0), 2))
            cur = cur + timedelta(days=1)

        # Nếu template của bạn dùng rating_labels riêng, gán như sau:
        rating_labels = labels.copy()

        from .models import AccOrderDetail, ServiceOrderDetail  # add local imports here

        # Tổng doanh thu trong khoảng (từ acc_detail + service_detail)
        acc_total_q = AccOrderDetail.objects.filter(
            product__store=store,
            order__created_date__range=(start_dt, end_dt)
        ).aggregate(total=Sum('total_amount')) if store else {'total': 0}

        svc_total_q = ServiceOrderDetail.objects.filter(
            product__store=store,
            order__created_date__range=(start_dt, end_dt)
        ).aggregate(total=Sum('total_amount')) if store else {'total': 0}

        acc_total = acc_total_q.get('total') or 0
        svc_total = svc_total_q.get('total') or 0
        revenue_total = acc_total + svc_total

        # --- revenue per day aligned với labels (labels là danh sách ngày đã tạo ở trên) ---
        # Group từng detail theo ngày để map
        acc_rev_grouped = (
            AccOrderDetail.objects.filter(
                product__store=store,
                order__created_date__range=(start_dt, end_dt)
            )
            .annotate(day=TruncDate('order__created_date'))
            .values('day')
            .annotate(sum_rev=Sum('total_amount'))
            .order_by('day')
        ) if store else []

        svc_rev_grouped = (
            ServiceOrderDetail.objects.filter(
                product__store=store,
                order__created_date__range=(start_dt, end_dt)
            )
            .annotate(day=TruncDate('order__created_date'))
            .values('day')
            .annotate(sum_rev=Sum('total_amount'))
            .order_by('day')
        ) if store else []

        # maps keyed by 'DD/MM/YYYY' just like orders_map
        acc_rev_map = {a['day'].strftime('%d/%m/%Y'): float(a['sum_rev'] or 0) for a in acc_rev_grouped}
        svc_rev_map = {s['day'].strftime('%d/%m/%Y'): float(s['sum_rev'] or 0) for s in svc_rev_grouped}

        # build revenue_values aligned with existing labels (labels list contains 'DD/MM' strings)
        revenue_values = []
        # we need to iterate the same date range as labels; your labels were created by looping cur from start_date..end_date
        # reuse the same approach: create lookup_key for each date in that loop
        cur = start_date
        while cur <= end_date:
            lookup_key = cur.strftime('%d/%m/%Y')
            # sum acc + svc for that day
            revenue_values.append(round((acc_rev_map.get(lookup_key, 0.0) + svc_rev_map.get(lookup_key, 0.0)), 0))
            cur = cur + timedelta(days=1)

        context = {
            'store': store,
            'store_code': store_code,
            'date_from': start_dt.date().isoformat(),
            'date_to': end_dt.date().isoformat(),

            'total_orders': total_orders,
            'completed_orders': completed_orders,
            'refunded_orders': refunded_orders,
            'complained_orders': complained_orders,
            'avg_rating': round(avg_rating, 2) if avg_rating else 0,
            'avg_delivery_hours': avg_delivery_hours,
            'complaint_rate_pct': round(complaint_rate * 100.0, 2),
            'refund_rate_pct': round(refund_rate * 100.0, 2),
            'fulfill_rate_pct': round(fulfill_rate * 100.0, 2),
            'reputation_score': score,

            # Data cho Chart.js
            'labels': labels,
            'order_counts': order_counts,
            'rating_labels': rating_labels,
            'rating_values': rating_values,
            'revenue_total': revenue_total,
            'revenue_values': revenue_values,
        }
        return TemplateResponse(request, 'admin/stats_view.html', context)


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
    writer.writerow(
        ['Mã đơn dịch vụ', 'Sản phẩm', 'Số lượng', 'Giá', 'Tổng tiền', 'Trạng thái', 'Link giao hàng', 'Ghi chú'])

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
                    'is_superuser', 'is_staff', 'is_active', 'date_joined', 'last_login', 'avatar_display']
    list_filter = ['role', 'is_staff', 'is_active', 'is_verified', 'is_superuser']
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
    list_filter = ['status', 'active']
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
    list_filter = ['created_date', 'active']


# Product
class ProductAdmin(admin.ModelAdmin):
    list_display = ['product_code', 'name', 'store', 'type', 'price', 'available_quantity', 'is_approved',
                    'active', 'created_date', 'updated_date', 'image_display']
    search_fields = ['name', 'store__name']
    list_filter = ['type', 'is_approved', 'store', 'active']

    readonly_fields = ['image_display']

    def image_display(self, obj):
        if obj.image:
            return mark_safe(f"<img src='{obj.image.url}' width='80' />")


class AccountStockAdmin(admin.ModelAdmin):
    list_display = ['stock_code', 'product', 'is_sold', 'sold_at', 'active', 'created_date', 'updated_date']
    list_filter = ['is_sold', 'product', 'active']
    search_fields = ['stock_code', 'product__name', 'content']
    readonly_fields = ['stock_code', 'sold_at', 'created_date', 'updated_date']
    list_per_page = 20


# Voucher
class VoucherAdmin(admin.ModelAdmin):
    list_display = ['voucher_code', 'code', 'store', 'discount_percent', 'max_discount', 'expired_at', 'quantity',
                    'active', 'created_date', 'updated_date']
    search_fields = ['code', 'store__name']
    list_filter = ['expired_at', 'active', 'store__store_code']


class ComplaintInlineAdmin(admin.StackedInline):
    model = Complaint
    fk_name = 'order'
    readonly_fields = ['complaint_code', 'image_display1', 'image_display2', 'image_display3', 'created_date',
                       'updated_date']  # Dùng để hiển thị ảnh

    fields = ['complaint_code', 'order', 'buyer', 'message', 'resolved', 'decision', 'admin',
              'active', 'created_date', 'updated_date', 'evidence_image1', 'evidence_image2', 'evidence_image3',
              'image_display1', 'image_display2', 'image_display3', 'evidence_video']  # Sắp xếp field hiển thị
    extra = 0

    def image_display1(self, obj):
        if obj.evidence_image1:
            return mark_safe(f"<img src='{obj.evidence_image1.url}' width='80' />")

    def image_display2(self, obj):
        if obj.evidence_image2:
            return mark_safe(f"<img src='{obj.evidence_image2.url}' width='80' />")

    def image_display3(self, obj):
        if obj.evidence_image3:
            return mark_safe(f"<img src='{obj.evidence_image3.url}' width='80' />")


# Order
class OrderAdmin(admin.ModelAdmin):
    list_display = ['order_code', 'buyer', 'is_paid', "voucher", 'status', 'released_at', 'active', 'created_date',
                    'updated_date']
    search_fields = ['order_code', 'buyer__username']
    list_filter = ['status', 'is_paid', 'active']
    inlines = [ComplaintInlineAdmin, ]


# AccOrderDetail
class AccOrderDetailAdmin(admin.ModelAdmin):
    list_display = ['acc_order_detail_code', 'order', 'product', 'unit_price', 'quantity', 'total_amount',
                    'discount_amount', 'content_delivered',
                    'active', 'created_date', 'updated_date']
    search_fields = ['order__order_code', 'product__name']
    list_filter = ['active']
    readonly_fields = ['total_amount', 'unit_price']
    actions = [export_to_csv_acc]


class ServiceOrderDetailAdmin(admin.ModelAdmin):
    list_display = ['service_order_detail_code', 'order', 'product', 'target_url', 'unit_price', 'quantity', 'status',
                    'total_amount', 'discount_amount',
                    'active', 'created_date', 'updated_date']
    search_fields = ['order__order_code', 'product__name', 'target_url']
    list_filter = ['status', 'active']
    readonly_fields = ['total_amount', 'unit_price']
    actions = [export_to_csv_service]


# Complaint
class ComplaintAdmin(admin.ModelAdmin):
    list_display = ['complaint_code', 'order', 'buyer', 'message', 'resolved', 'decision', 'admin',
                    'active', 'created_date', 'updated_date', 'image_display1', 'image_display2', 'image_display3',
                    'evidence_video']
    search_fields = ['order__order_code', 'buyer__username']
    list_filter = ['resolved', 'decision', 'order__order_code', 'active']
    readonly_fields = ['image_display1', 'image_display2', 'image_display3']

    def image_display1(self, obj):
        if obj.evidence_image1:
            return mark_safe(f"<img src='{obj.evidence_image1.url}' width='80' />")

    def image_display2(self, obj):
        if obj.evidence_image2:
            return mark_safe(f"<img src='{obj.evidence_image2.url}' width='80' />")

    def image_display3(self, obj):
        if obj.evidence_image3:
            return mark_safe(f"<img src='{obj.evidence_image3.url}' width='80' />")


# Review
class ReviewAdmin(admin.ModelAdmin):
    list_display = ['review_code', 'product', 'order', 'buyer', 'rating', 'active', 'created_date', 'updated_date']
    search_fields = ['product__name', 'buyer__username']
    list_filter = ['product__product_code', 'rating', 'active']

# Blog
class BlogAdmin(admin.ModelAdmin):
    list_display = ['blog_code', 'title', 'author', 'category', 'active', 'created_date', 'updated_date']
    search_fields = ['title']
    list_filter = ['author__user_code', 'category', 'active']


# BlogComment
class BlogCommentAdmin(admin.ModelAdmin):
    list_display = ['blog_comment_code', 'blog', 'author', 'active', 'created_date', 'updated_date']
    search_fields = ['blog__title', 'author__username']
    list_filter = ['blog__blog_code', 'active']


# Blog Like
class BlogLikeAdmin(admin.ModelAdmin):
    list_display = ['blog_like_code', 'blog', 'user', 'active', 'created_date', 'updated_date']
    search_fields = ['blog__title', 'user__username']
    list_filter = ['blog__blog_code', 'active']

# TransactionHistory
class TransactionHistoryAdmin(admin.ModelAdmin):
    list_display = ['transaction_code', 'user', 'type', 'amount', 'active', 'created_date', 'updated_date']
    search_fields = ['user__username']
    list_filter = ['type', 'active']


# FavoriteProduct
class FavoriteProductAdmin(admin.ModelAdmin):
    list_display = ['favorite_code', 'user', 'product', 'active', 'created_date', 'updated_date']
    search_fields = ['user__username', 'product__name']
    list_filter = ['user__user_code', 'active']


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
