from rest_framework import routers

from .views import JobViewSet, PlanViewSet, ProductViewSet, VersionViewSet

router = routers.DefaultRouter()
router.register(r"jobs", JobViewSet, basename="job")
router.register(r"products", ProductViewSet, basename="product")
router.register(r"versions", VersionViewSet, basename="version")
router.register(r"plans", PlanViewSet, basename="plan")
urlpatterns = router.urls
