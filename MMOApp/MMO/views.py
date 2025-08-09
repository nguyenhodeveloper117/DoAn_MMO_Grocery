from rest_framework import viewsets, generics, parsers, status, filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, parser_classes
import cloudinary.uploader
from . import perms, paginators, serializers
from . import models

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


class ProductViewSet(viewsets.ViewSet, generics.ListAPIView, generics.CreateAPIView, generics.UpdateAPIView, generics.DestroyAPIView):
    queryset = models.Product.objects.filter(active=True)
    serializer_class = serializers.ProductSerializer
    parser_classes = [parsers.MultiPartParser]
    pagination_class = paginators.ProductPaginator

    # Thêm filter và search
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = {
        'type': ['exact'],
        'price': ['gte', 'lte'],
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
            queryset = models.Product.objects.filter(store=store)

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

class BlogViewSet(viewsets.ViewSet, generics.CreateAPIView, generics.ListAPIView, generics.UpdateAPIView, generics.DestroyAPIView):
    queryset = models.Blog.objects.filter(active=True)
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
        queryset = models.Blog.objects.filter(author=request.user)

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