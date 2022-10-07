from django.urls import path
from rest_framework import routers

from .views import (
    AllowedListOrgViewSet,
    AllowedListViewSet,
    PlanSlugViewSet,
    PlanTemplateViewSet,
    PlanViewSet,
    ProductCategoryViewSet,
    ProductSlugViewSet,
    ProductViewSet,
    SiteProfileView,
    TranslationViewSet,
    VersionViewSet,
)


def _get_api_basename(viewset):
    return viewset.model_name.lower()


app_name = "admin_api"
router = routers.DefaultRouter(trailing_slash=False)
router.get_default_basename = _get_api_basename
router.register(r"allowedlists", AllowedListViewSet)
router.register(r"allowedlistorgs", AllowedListOrgViewSet)
router.register(r"plans", PlanViewSet)
router.register(r"plantemplates", PlanTemplateViewSet)
router.register(r"planslug", PlanSlugViewSet)
router.register(r"productcategory", ProductCategoryViewSet)
router.register(r"products", ProductViewSet)
router.register(r"productslug", ProductSlugViewSet)
router.register(r"versions", VersionViewSet)
router.register(r"translations", TranslationViewSet)
urlpatterns = router.urls + [
    path("siteprofile", SiteProfileView.as_view(), name="siteprofile")
]
