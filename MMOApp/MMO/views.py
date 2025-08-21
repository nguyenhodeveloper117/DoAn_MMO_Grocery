from django.db.models import Q
from rest_framework import viewsets, generics, parsers, status, filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.decorators import action, api_view, parser_classes
import cloudinary.uploader
from . import perms, paginators, serializers
from . import models
from django.utils import timezone
from django.db.models import Count, Sum
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils.dateparse import parse_datetime
from .models import Order


class UserViewSet(viewsets.ViewSet, generics.CreateAPIView, generics.UpdateAPIView):
    queryset = models.User.objects.filter(is_active=True)
    serializer_class = serializers.UserSerializer
    parser_classes = [parsers.MultiPartParser]

    def get_permissions(self):
        if self.action == 'upgrade_to_seller':
            return [perms.IsVerified()]
        if self.request.method in ['PUT', 'PATCH']:
            return [perms.OwnerPerms()]
        return [AllowAny()]

    @action(methods=['get'], url_path='current-user', detail=False, permission_classes=[IsAuthenticated])
    def get_current_user(self, request):
        return Response(serializers.UserSerializer(request.user).data)

    @action(methods=['patch'], detail=False, url_path='upgrade-to-seller')
    def upgrade_to_seller(self, request):
        user = request.user
        user.role = 'seller'
        user.save()
        return Response({'message': 'Đã cập nhật role thành seller'}, status=status.HTTP_200_OK)


class StoreViewSet(viewsets.ViewSet, generics.ListAPIView, generics.CreateAPIView, generics.UpdateAPIView):
    queryset = models.Store.objects.filter(active=True)
    serializer_class = serializers.StoreSerializer

    def get_permissions(self):
        if self.action == 'my_store':
            return [IsAuthenticated()]
        if self.request.method in ['POST', 'PUT', 'PATCH']:
            return [perms.IsSeller()]
        return [AllowAny()]

    @action(detail=False, methods=['get'], url_path='my-store')
    def my_store(self, request):
        try:
            store = models.Store.objects.get(seller=request.user, active=True)
            serializer = self.get_serializer(store)
            return Response(serializer.data)
        except models.Store.DoesNotExist:
            return Response({'error': 'Store not found'}, status=404)


class VerificationViewSet(viewsets.ViewSet, generics.CreateAPIView, generics.UpdateAPIView):
    queryset = models.Verification.objects.filter(active=True)
    serializer_class = serializers.VerificationSerializer
    parser_classes = [parsers.MultiPartParser]

    def get_permissions(self):
        if self.action == 'my_verification':
            return [IsAuthenticated()]
        if self.request.method == 'POST':
            return [IsAuthenticated()]
        if self.request.method in ['PUT', 'PATCH']:
            return [perms.IsVerificationOwner()]

        return [AllowAny()]

    @action(detail=False, methods=['get'], url_path='my-verification')
    def my_verification(self, request):
        try:
            verification = models.Verification.objects.get(user=request.user, active=True)
            serializer = self.get_serializer(verification)
            return Response(serializer.data)
        except models.Verification.DoesNotExist:
            return Response({'error': 'Verification not found'}, status=status.HTTP_404_NOT_FOUND)


class ProductViewSet(viewsets.ViewSet, generics.ListAPIView, generics.CreateAPIView, generics.UpdateAPIView,
                     generics.DestroyAPIView):
    queryset = models.Product.objects.filter(active=True, is_approved=True).order_by('-created_date')
    serializer_class = serializers.ProductSerializer
    parser_classes = [parsers.MultiPartParser]
    pagination_class = paginators.ProductPaginator

    # Thêm filter và search
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = {
        'type': ['exact'],
        'price': ['gte', 'lte'],
        'is_approved': ['exact'],
    }
    search_fields = ['name']

    def get_permissions(self):
        if self.action == 'my_products':
            return [perms.IsSellerProduct()]
        if self.request.method in ['POST', 'PUT', 'PATCH', 'DELETE']:
            return [perms.IsSellerProduct()]
        return [AllowAny()]

    @action(detail=False, methods=['get'], url_path='my-products')
    def my_products(self, request):
        try:
            store = models.Store.objects.get(seller=request.user, active=True)
            queryset = models.Product.objects.filter(store=store).order_by('-created_date')

            # Áp dụng filter + search thủ công
            filter_backends = [DjangoFilterBackend, filters.SearchFilter]
            for backend in filter_backends:
                queryset = backend().filter_queryset(request, queryset, self)

            # Áp dụng phân trang thủ công
            page = self.paginate_queryset(queryset)
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                return self.get_paginated_response(serializer.data)

            # Không có phân trang
            serializer = self.get_serializer(queryset, many=True)
            return Response(serializer.data)

        except models.Store.DoesNotExist:
            return Response({'error': 'Store not found'}, status=status.HTTP_404_NOT_FOUND)


class BlogViewSet(viewsets.ViewSet, generics.CreateAPIView, generics.ListAPIView, generics.UpdateAPIView,
                  generics.DestroyAPIView):
    queryset = models.Blog.objects.filter(active=True).order_by('-created_date')
    serializer_class = serializers.BlogSerializer
    pagination_class = paginators.BlogPaginator

    # Thêm filter và search
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = {
        'category': ['exact'],
    }
    search_fields = ['title']

    def get_permissions(self):
        if self.action == 'my_blogs':
            return [IsAuthenticated()]
        if self.request.method in ['POST']:
            return [IsAuthenticated()]
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [perms.BlogOwnerPerms()]
        return [AllowAny()]

    @action(detail=False, methods=['get'], url_path='my-blogs')
    def my_blogs(self, request):
        # Lấy blog do chính user viết
        queryset = models.Blog.objects.filter(author=request.user).order_by('-created_date')

        # Áp dụng filter + search
        for backend in self.filter_backends:
            queryset = backend().filter_queryset(request, queryset, self)

        # Phân trang
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        # Không phân trang
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


@api_view(['POST'])
@parser_classes([parsers.MultiPartParser, parsers.FormParser])
def upload_image_cloudinary(request):
    image = request.FILES.get('image')
    if not image:
        return Response({"error": "No image uploaded"}, status=status.HTTP_400_BAD_REQUEST)
    try:
        result = cloudinary.uploader.upload(image)
        return Response({"url": result["secure_url"]}, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class BlogCommentViewSet(viewsets.ViewSet, generics.DestroyAPIView):
    queryset = models.BlogComment.objects.filter(active=True).order_by('-created_date')
    serializer_class = serializers.BlogCommentSerializer
    pagination_class = paginators.BlogCommentPaginator

    def get_permissions(self):
        if self.action == 'get_blog_comments':
            return [AllowAny()]
        if self.action == ['create_comment_for_blog']:
            return [IsAuthenticated()]
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [perms.BlogOwnerPerms()]
        return [AllowAny()]

    @action(detail=True, methods=['get'], url_path='get-blog-comments')
    def get_comments_by_blog(self, request, pk=None):
        try:
            blog = models.Blog.objects.get(pk=pk)
        except models.Blog.DoesNotExist:
            return Response({"detail": "Blog không tồn tại"}, status=404)

        queryset = models.BlogComment.objects.filter(blog=blog).order_by('-created_date')

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='post-comments')
    def create_comment_for_blog(self, request, pk=None):
        try:
            blog = models.Blog.objects.get(pk=pk, active=True)
        except models.Blog.DoesNotExist:
            return Response({"detail": "Blog không tồn tại hoặc không hoạt động"}, status=404)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(blog=blog, author=request.user)
        return Response(serializer.data, status=201)


class BlogLikeViewSet(viewsets.ViewSet):
    queryset = models.BlogLike.objects.filter(active=True)
    serializer_class = serializers.BlogLikeSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated()]
        return [AllowAny()]

    @action(detail=True, methods=['post'], url_path='like')
    def like(self, request, pk=None):
        try:
            blog = models.Blog.objects.get(pk=pk, active=True)
        except models.Blog.DoesNotExist:
            return Response({"detail": "Blog không tồn tại"}, status=status.HTTP_404_NOT_FOUND)

        user = request.user
        # Tìm like của user với blog, nếu có thì toggle active, nếu không thì tạo mới
        like_obj, created = models.BlogLike.objects.get_or_create(blog=blog, user=user)
        if not created:
            # Nếu đã like rồi, bỏ like (xóa hoặc chuyển active)
            # Nếu muốn xóa luôn, có thể like_obj.delete()
            # Ở đây giả sử toggle active:
            like_obj.active = not like_obj.active
            like_obj.save()
            message = "Đã bỏ thích" if not like_obj.active else "Đã thích"
        else:
            like_obj.active = True
            like_obj.save()
            message = "Đã thích"

        # Trả về số like hiện tại
        like_count = blog.likes.filter(active=True).count()

        return Response({"blog_code": blog.blog_code, "like_count": like_count, "message": message},
                        status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], url_path='like-count')
    def like_count(self, request, pk=None):
        try:
            blog = models.Blog.objects.get(pk=pk, active=True)
        except models.Blog.DoesNotExist:
            return Response({"detail": "Blog không tồn tại"}, status=404)

        count = blog.likes.filter(active=True).count()
        liked = False
        if request.user.is_authenticated:
            liked = blog.likes.filter(user=request.user, active=True).exists()

        return Response({"blog_code": blog.blog_code, "like_count": count, "liked": liked})


class AccountStockViewSet(viewsets.ViewSet, generics.DestroyAPIView, generics.UpdateAPIView):
    queryset = models.AccountStock.objects.filter(active=True)
    serializer_class = serializers.AccountStockSerializer
    pagination_class = paginators.StockPaginator

    # Thêm search
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ['content', 'sold_at']

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [perms.IsSellerStock()]
        if self.action == 'create_account_stock':
            return [perms.IsSeller()]
        if self.action == 'get_stocks_for_product':
            return [perms.IsSellerStock()]
        return [AllowAny()]

    @action(detail=True, methods=['get'], url_path='product-stocks')
    def get_stocks_for_product(self, request, pk=None):
        try:
            product = models.Product.objects.get(
                pk=pk,
                active=True,
                store__seller=request.user
            )
        except models.Product.DoesNotExist:
            return Response(
                {"detail": "Sản phẩm không tồn tại hoặc bạn không sở hữu"},
                status=status.HTTP_404_NOT_FOUND
            )

        # base queryset (chỉ những stock active thuộc product)
        qs = product.stocks.filter(active=True)

        # áp dụng filter_backends (search, filters) nếu có
        qs = self.filter_queryset(qs)

        # phân trang bằng các helper của GenericAPIView
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        # nếu không phân trang (ví dụ paginator = None), trả về danh sách đầy đủ
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='create-stock')
    def create_stock_for_product(self, request, pk=None):
        try:
            product = models.Product.objects.get(
                pk=pk,
                active=True,
                store__seller=request.user
            )
        except models.Product.DoesNotExist:
            return Response(
                {"detail": "Sản phẩm không tồn tại hoặc bạn không sở hữu"},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(product=product)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class VoucherViewSet(viewsets.ViewSet, generics.CreateAPIView, generics.DestroyAPIView, generics.UpdateAPIView):
    queryset = models.Voucher.objects.filter(active=True)
    serializer_class = serializers.VoucherSerializer

    # Thêm search
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ['code', 'discount_percent']

    def get_permissions(self):
        if self.action == 'my_vouchers':
            return [perms.IsSellerProduct()]
        if self.action == 'check_voucher':
            return [IsAuthenticated()]
        if self.request.method in ['POST', 'PUT', 'PATCH', 'DELETE']:
            return [perms.IsSellerProduct()]
        return [AllowAny()]

    @action(detail=False, methods=['get'], url_path='my-vouchers')
    def my_vouchers(self, request):
        try:
            store = models.Store.objects.get(seller=request.user, active=True)
            queryset = models.Voucher.objects.filter(store=store).order_by('created_date')

            # Chỉ áp dụng search filter thủ công
            search_backend = filters.SearchFilter()
            queryset = search_backend.filter_queryset(request, queryset, self)

            serializer = self.get_serializer(queryset, many=True)
            return Response(serializer.data)

        except models.Store.DoesNotExist:
            return Response({'error': 'Store not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['post'], url_path='check')
    def check_voucher(self, request):
        code = request.data.get("code")
        total_amount = int(request.data.get("total_amount", 0))
        product_code = request.data.get("product_code")

        try:
            voucher = models.Voucher.objects.get(code=code)

            # Kiểm tra hết hạn
            if voucher.expired_at and voucher.expired_at < timezone.now():
                return Response({"error": "Voucher đã hết hạn"}, status=status.HTTP_400_BAD_REQUEST)

            # Kiểm tra số lượng còn lại
            if voucher.quantity <= 0:
                return Response({"error": "Voucher đã hết lượt sử dụng"}, status=status.HTTP_400_BAD_REQUEST)

            # Check store (voucher phải cùng store với sản phẩm)
            if product_code:
                try:
                    product = models.Product.objects.get(product_code=product_code)
                    if voucher.store != product.store:
                        return Response({"error": "Voucher không thuộc cửa hàng này"},
                                        status=status.HTTP_400_BAD_REQUEST)
                except models.Product.DoesNotExist:
                    return Response({"error": "Sản phẩm không tồn tại"}, status=status.HTTP_404_NOT_FOUND)

            # Tính giảm giá (theo %)
            discount = int(total_amount * voucher.discount_percent / 100)

            # Giới hạn max discount
            if voucher.max_discount and discount > voucher.max_discount:
                discount = voucher.max_discount

            return Response({
                "valid": True,
                "discount_amount": discount,
                "final_amount": int(total_amount - discount),
            })

        except models.Voucher.DoesNotExist:
            return Response({"error": "Voucher không hợp lệ"}, status=status.HTTP_404_NOT_FOUND)


class OrderViewSet(viewsets.ViewSet, generics.CreateAPIView, generics.UpdateAPIView):
    queryset = models.Order.objects.filter(active=True)
    serializer_class = serializers.OrderSerializer
    pagination_class = paginators.OderPaginator

    # Thêm filter và search
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = {
        'status': ['exact'],
    }
    search_fields = ['order_code']

    def get_permissions(self):
        if self.action in ['my_orders']:
            return [perms.IsOrderOwner()]
        if self.action in ['store_orders']:
            return [perms.IsSellerOrder()]
        if self.action in ['details']:
            return [perms.IsOrderOrSeller()]
        if self.request.method in ['POST']:
            return [IsAuthenticated()]
        if self.request.method in ['PUT', 'PATCH']:
            return [perms.CanCancel()]
        return [AllowAny()]

    # tất cả order của user
    @action(detail=False, methods=['get'], url_path='my-orders')
    def my_orders(self, request, *args, **kwargs):
        qs = models.Order.objects.filter(
            active=True,
            buyer=request.user
        ).select_related(
            'buyer', 'voucher'
        ).prefetch_related(
            'acc_detail__product',
            'service_detail__product'
        )

        # Áp dụng filter_backends (ví dụ ?status=processing)
        qs = self.filter_queryset(qs).order_by('-created_date')

        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    # tất cả order của store của seller đang đăng nhập
    @action(detail=False, methods=['get'], url_path='store-orders')
    def store_orders(self, request, *args, **kwargs):
        # yêu cầu user phải có store (vì IsSellerProduct đảm bảo là seller)
        store = getattr(request.user, 'store', None)
        if store is None:
            return Response({"detail": "Seller chưa có store."}, status=400)

        qs = models.Order.objects.filter(
            active=True
        ).filter(
            Q(acc_detail__product__store=store) |
            Q(service_detail__product__store=store)
        ).select_related(
            'buyer', 'voucher'
        ).prefetch_related(
            'acc_detail__product', 'service_detail__product'
        ).distinct()

        # Áp dụng filter_backends (ví dụ ?status=delivered)
        qs = self.filter_queryset(qs).order_by('-created_date')

        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='details')
    def details(self, request, pk=None):
        # Lấy chi tiết đơn hàng theo order_code
        try:
            order = self.get_object()

            if hasattr(order, "acc_detail"):
                serializer = serializers.AccOrderDetailSerializer(order.acc_detail)
                return Response({
                    "type": "account",
                    "order": order.order_code,
                    "detail": serializer.data
                })

            if hasattr(order, "service_detail"):
                serializer = serializers.ServiceOrderDetailSerializer(order.service_detail)
                return Response({
                    "type": "service",
                    "order": order.order_code,
                    "detail": serializer.data
                })

            return Response({"error": "Order chưa có detail"}, status=status.HTTP_404_NOT_FOUND)

        except models.Order.DoesNotExist:
            return Response({"error": "Không tìm thấy order"}, status=status.HTTP_404_NOT_FOUND)


class AccOrderDetailViewSet(viewsets.ViewSet, generics.CreateAPIView):
    queryset = models.AccOrderDetail.objects.filter(active=True)
    serializer_class = serializers.AccOrderDetailSerializer

    def get_permissions(self):
        if self.request.method in ['POST']:
            return [perms.CanPostOrderDetail()]
        return [AllowAny()]

class ServiceOrderDetailViewSet(viewsets.ViewSet, generics.UpdateAPIView, generics.CreateAPIView):
    queryset = models.ServiceOrderDetail.objects.filter(active=True)
    serializer_class = serializers.ServiceOrderDetailSerializer

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH']:
            return [perms.IsOrderOwnerOrSeller()]
        if self.request.method in ['POST']:
            return [perms.CanPostOrderDetail()]
        return [AllowAny()]

class OrderStatsAPIView(APIView):
    permission_classes = [perms.IsSeller]

    def get(self, request):
        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")

        if start_date:
            start_date = parse_datetime(start_date)
        if end_date:
            end_date = parse_datetime(end_date)

        # store của seller hiện tại
        store = getattr(request.user, "store", None)
        if not store:
            return Response({"error": "Bạn chưa có gian hàng"}, status=400)

        # order liên quan tới store
        orders = Order.objects.filter(
            Q(acc_detail__product__store=store) |
            Q(service_detail__product__store=store)
        )

        if start_date:
            orders = orders.filter(created_date__gte=start_date)
        if end_date:
            orders = orders.filter(created_date__lte=end_date)

        # tổng quan
        stats = orders.filter(active=True).aggregate(
            total_orders=Count("order_code", distinct=True),
            acc_revenue=Sum("acc_detail__total_amount"),
            service_revenue=Sum("service_detail__total_amount"),
        )

        # riêng từng loại
        acc_stats = orders.filter(active=True, acc_detail__isnull=False).aggregate(
            acc_orders=Count("order_code", distinct=True),
            acc_revenue=Sum("acc_detail__total_amount"),
        )
        service_stats = orders.filter(active=True, service_detail__isnull=False).aggregate(
            service_orders=Count("order_code", distinct=True),
            service_revenue=Sum("service_detail__total_amount"),
        )

        # fix None -> 0
        stats["total_orders"] = stats["total_orders"] or 0
        stats["acc_orders"] = acc_stats["acc_orders"] or 0
        stats["service_orders"] = service_stats["service_orders"] or 0
        stats["acc_revenue"] = acc_stats["acc_revenue"] or 0
        stats["service_revenue"] = service_stats["service_revenue"] or 0
        stats["total_revenue"] = stats["acc_revenue"] + stats["service_revenue"]

        return Response(stats)

class ReviewViewSet(viewsets.ViewSet, generics.CreateAPIView):
    queryset = models.Review.objects.filter(active=True)
    serializer_class = serializers.ReviewSerializer
    pagination_class = paginators.ReviewPaginator

    def get_permissions(self):
        if self.request.method in ['POST']:
            return [perms.CanReviewProduct()]
        if self.action in ['get_reviews_by_product']:
            return [AllowAny()]
        return [AllowAny()]

    @action(detail=False, methods=['GET'], url_path='by-product/(?P<product_code>[^/.]+)')
    def get_reviews_by_product(self, request, product_code=None):
        # Lấy danh sách review của một product cụ thể
        reviews = self.queryset.filter(product__product_code=product_code).order_by("-created_date")
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(reviews, request)
        if page is not None:
            serializer = self.serializer_class(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = self.serializer_class(reviews, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class FavoriteProductViewSet(viewsets.ViewSet, generics.CreateAPIView, generics.DestroyAPIView):
    queryset = models.FavoriteProduct.objects.filter(active=True)
    serializer_class = serializers.FavoriteProductSerializer

    def get_permissions(self):
        if self.request.method in ['POST', 'DELETE']:
            return [IsAuthenticated()]
        if self.action in ['my_favorites']:
            return [IsAuthenticated()]
        return [AllowAny()]

    @action(detail=False, methods=['get'], url_path='my-favorites')
    def my_favorites(self, request):
        user = request.user
        search = request.query_params.get("search")  # ?search=apple

        favorites = models.FavoriteProduct.objects.filter(
            user=user,
            active=True
        ).select_related("product")

        if search:
            favorites = favorites.filter(product__name__icontains=search)

        products = [fav.product for fav in favorites]
        serializer = serializers.ProductSerializer(products, many=True, context={"request": request})
        return Response(serializer.data)