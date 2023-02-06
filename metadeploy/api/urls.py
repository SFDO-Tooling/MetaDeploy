from django.urls import path
from rest_framework import routers
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

from .views import (
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

urlpatterns = router.urls + [
    path("user/", UserView.as_view(), name="user"),
    path("schema/", SpectacularAPIView.as_view(), name="schema"),
    # Optional UI:
    path(
        "schema/swagger-ui/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
    path(
        "schema/redoc/",
        SpectacularRedocView.as_view(url_name="schema"),
        name="redoc",
    ),
]
