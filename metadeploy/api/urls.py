from django.conf.urls import url
from rest_framework import routers

from .views import ProductViewSet, TriggerBuildView


router = routers.DefaultRouter()
router.register(r'products', ProductViewSet)
urlpatterns = router.urls + [
    url(r'^start/$', TriggerBuildView.as_view()),
]
