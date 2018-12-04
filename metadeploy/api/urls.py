from rest_framework import routers

from .views import JobViewSet, PlanViewSet, ProductViewSet, VersionViewSet

router = routers.DefaultRouter()
router.register(r"jobs", JobViewSet, basename="job")
router.register(r"products", ProductViewSet)
router.register(r"versions", VersionViewSet)
router.register(r"plans", PlanViewSet)
urlpatterns = router.urls
