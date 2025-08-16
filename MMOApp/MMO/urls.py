from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from django.urls import path
from .views import upload_image_cloudinary

router = DefaultRouter()
router.register('users', views.UserViewSet, basename='user')
router.register('stores', views.StoreViewSet, basename='store')
router.register('verifications', views.VerificationViewSet, basename='verification')
router.register('products', views.ProductViewSet, basename='product')
router.register('blogs', views.BlogViewSet, basename='blog')
router.register('blog-comments', views.BlogCommentViewSet, basename='blog-comment')
router.register('blog-likes', views.BlogLikeViewSet, basename='blog-like')
router.register('account-stocks', views.AccountStockViewSet, basename='account-stock')
router.register('vouchers', views.VoucherViewSet, basename='voucher')
router.register('orders', views.OrderViewSet, basename='order')
router.register('acc-orders-detail', views.AccOrderDetailViewSet, basename='acc-order-detail')
router.register('service-orders-detail', views.ServiceOrderDetailViewSet, basename='service-orders-detail')

urlpatterns = [
    path('upload-image/', upload_image_cloudinary, name='upload-image-cloudinary'),
    path('', include(router.urls)),
]