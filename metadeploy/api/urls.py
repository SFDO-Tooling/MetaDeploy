from rest_framework import routers

from .views import ProjectViewSet


router = routers.DefaultRouter()
router.register(r'projects', ProjectViewSet)
urlpatterns = router.urls
