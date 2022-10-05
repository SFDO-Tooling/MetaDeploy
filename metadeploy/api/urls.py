from django.conf import settings
from django.urls import path
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView
from rest_framework import routers

from .views import (
    JobViewSet,
    ResetTokenView,
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
router.register("categories", ProductCategoryViewSet, basename="productcategory")
router.register("scratch-orgs", ScratchOrgViewSet, basename="scratch-org")
urlpatterns = router.urls + [
    path("user/", UserView.as_view(), name="user"),
    path("orgs/", OrgViewSet.as_view(), name="org-list"),
    path("token/", ResetTokenView.as_view(), name="token"),
]

if settings.API_DOCS_ENABLED:  # pragma: nocover
    urlpatterns += [
        path("schema/", SpectacularAPIView.as_view(), name="schema"),
        path(
            "schema/redoc/",
            SpectacularRedocView.as_view(url_name="schema"),
            name="redoc",
        ),
    ]
