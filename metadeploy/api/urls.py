from django.conf.urls import url
from rest_framework import routers

from .views import (
    ProductViewSet,
    JobViewSet,
    TriggerBuildView,
)


router = routers.DefaultRouter()
router.register(r'products', ProductViewSet)
router.register(r'jobs', JobViewSet)
urlpatterns = router.urls + [
    url(r'^start/$', TriggerBuildView.as_view()),
]
