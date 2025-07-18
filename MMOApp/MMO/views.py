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
        if self.request.method in ['PUT', 'PATCH']:
            return [perms.OwnerPerms()]
        return [AllowAny()]

    @action(methods=['get'], url_path='current-user', detail=False, permission_classes=[IsAuthenticated])
    def get_current_user(self, request):
        return Response(serializers.UserSerializer(request.user).data)

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



