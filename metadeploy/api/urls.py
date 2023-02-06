from django.urls import path
from rest_framework import routers

from .views import (
    BootstrapView,
    JobViewSet,
    OrgViewSet,
    PlanViewSet,
    ProductCategoryViewSet,
    ProductViewSet,
    ScratchOrgViewSet,
    UserView,
    VersionViewSet,
)

router = routers.DefaultRouter()
router.register("jobs", JobViewSet, basename="job")
router.register("products", ProductViewSet, basename="product")
router.register("versions", VersionViewSet, basename="version")
router.register("plans", PlanViewSet, basename="plan")
router.register("orgs", OrgViewSet, basename="org")
router.register("categories", ProductCategoryViewSet)
router.register("scratch-orgs", ScratchOrgViewSet, basename="scratch-org")
router.register("ui", BootstrapView, basename="ui")
urlpatterns = router.urls + [path("user/", UserView.as_view(), name="user")]
