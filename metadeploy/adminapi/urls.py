from rest_framework import routers

from .api import PlanViewSet, ProductViewSet, VersionViewSet


def _get_api_basename(viewset):
    model_name = getattr(viewset, "model_name", None)

    return f"admin_{model_name.lower()}"


router = routers.DefaultRouter()
router.get_default_basename = _get_api_basename
router.register(r"products", ProductViewSet)
router.register(r"versions", VersionViewSet)
router.register(r"plans", PlanViewSet)
urlpatterns = router.urls
