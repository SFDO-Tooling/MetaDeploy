from rest_framework import routers

from .api import (
    PlanSlugViewSet,
    PlanViewSet,
    ProductCategoryViewSet,
    ProductSlugViewSet,
    ProductViewSet,
    VersionViewSet,
)


def _get_api_basename(viewset):
    model_name = getattr(viewset, "model_name", None)

    return model_name.lower()


app_name = "admin_api"
router = routers.DefaultRouter()
router.get_default_basename = _get_api_basename
router.register(r"plans", PlanViewSet)
router.register(r"planslug", PlanSlugViewSet)
router.register(r"productcategory", ProductCategoryViewSet)
router.register(r"products", ProductViewSet)
router.register(r"productslug", ProductSlugViewSet)
router.register(r"versions", VersionViewSet)
urlpatterns = router.urls
