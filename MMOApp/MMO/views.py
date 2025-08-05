from rest_framework import viewsets, generics, parsers, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.decorators import action
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
    queryset = models.Product.objects.filter(active=True, is_approved=True)
    serializer_class = serializers.ProductSerializer
    parser_classes = [parsers.MultiPartParser]
    pagination_class = paginators.ProductPaginator

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
            products = models.Product.objects.filter(store=store)
            serializer = self.get_serializer(products, many=True)
            return Response(serializer.data)
        except models.Store.DoesNotExist:
            return Response({'error': 'Store not found'}, status=status.HTTP_404_NOT_FOUND)
