from rest_framework import routers

from .views import (
    JobViewSet,
    OrgViewSet,
    PlanViewSet,
    ProductViewSet,
    SiteViewSet,
    VersionViewSet,
)

router = routers.DefaultRouter()
router.register("jobs", JobViewSet, basename="job")
router.register("products", ProductViewSet)
router.register("versions", VersionViewSet)
router.register("plans", PlanViewSet)
router.register("orgs", OrgViewSet, basename="org")
router.register("site", SiteViewSet)
urlpatterns = router.urls
