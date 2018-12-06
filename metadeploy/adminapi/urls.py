from rest_framework import routers

from .api import PlanViewSet, ProductViewSet, VersionViewSet

router = routers.DefaultRouter()
# router.register(r"jobs", JobViewSet, basename="job")
router.register(r"products", ProductViewSet, basename="admin_product")
router.register(r"versions", VersionViewSet, basename="admin_version")
router.register(r"plans", PlanViewSet, basename="admin_plan")
urlpatterns = router.urls
