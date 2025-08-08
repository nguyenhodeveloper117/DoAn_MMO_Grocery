from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from django.urls import path

router = DefaultRouter()
router.register('users', views.UserViewSet, basename='user')
router.register('stores', views.StoreViewSet, basename='store')
router.register('verifications', views.VerificationViewSet, basename='verification')
router.register('products', views.ProductViewSet, basename='product')
router.register('blogs', views.BlogViewSet, basename='blog')

urlpatterns = [
    path('', include(router.urls)),
]