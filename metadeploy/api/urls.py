from rest_framework import routers

from .views import JobViewSet, OrgViewSet, PlanViewSet, ProductViewSet, VersionViewSet

router = routers.DefaultRouter()
router.register("jobs", JobViewSet, basename="job")
router.register("products", ProductViewSet)
router.register("versions", VersionViewSet)
router.register("plans", PlanViewSet)
router.register("orgs", OrgViewSet, basename="org")
urlpatterns = router.urls
