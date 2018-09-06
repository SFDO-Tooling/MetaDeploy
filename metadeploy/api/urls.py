from rest_framework import routers

from .views import (
    ProductViewSet,
    JobViewSet,
)


router = routers.DefaultRouter()
router.register(r'products', ProductViewSet)
router.register(r'jobs', JobViewSet)
urlpatterns = router.urls
