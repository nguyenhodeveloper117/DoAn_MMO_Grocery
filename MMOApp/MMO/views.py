from rest_framework import viewsets, generics, parsers
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.decorators import action
from .import perms, paginators
from .serializers import UserSerializer
from .models import User


class UserViewSet(viewsets.ViewSet, generics.CreateAPIView, generics.UpdateAPIView):
    queryset = User.objects.filter(is_active=True)
    serializer_class = UserSerializer
    parser_classes = [parsers.MultiPartParser]

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH']:
            return [perms.OwnerPerms()]
        return [AllowAny()]

    @action(methods=['get'], url_path='current-user', detail=False, permission_classes=[IsAuthenticated])
    def get_current_user(self, request):
        return Response(UserSerializer(request.user).data)
