from rest_framework import routers

from .views import (
    ProductViewSet,
    JobViewSet,
    VersionViewSet,
)


router = routers.DefaultRouter()
router.register(r'products', ProductViewSet)
router.register(r'jobs', JobViewSet)
router.register(r'versions', VersionViewSet)
urlpatterns = router.urls
