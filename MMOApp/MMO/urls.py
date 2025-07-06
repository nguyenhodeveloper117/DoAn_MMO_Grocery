from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from django.urls import path

router = DefaultRouter()
# router.register('candidates', views.CandidateViewSet, basename='candidate')

urlpatterns = [
    path('', include(router.urls)),
]