from django.urls import path
from rest_framework import routers

from .views import (
    JobViewSet,
    OrgViewSet,
    PlanViewSet,
    ProductCategoryViewSet,
    ProductViewSet,
    UserView,
    VersionViewSet,
)

router = routers.DefaultRouter()
router.register("jobs", JobViewSet, basename="job")
router.register("products", ProductViewSet)
router.register("versions", VersionViewSet)
router.register("plans", PlanViewSet)
router.register("orgs", OrgViewSet, basename="org")
router.register("categories", ProductCategoryViewSet)
urlpatterns = router.urls + [path("user/", UserView.as_view(), name="user")]
