from rest_framework import viewsets, views, status, permissions
from rest_framework.response import Response

from . import jobs
from .serializers import (
    ProductSerializer,
    TriggerInstallSerializer,
)
from .models import Product


class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    queryset = Product.objects.all()


class TriggerBuildView(views.APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        serializer = TriggerInstallSerializer(data=request.data)
        if serializer.is_valid():
            # TODO: this may not be an accurate token?
            user = request.user
            token = user.socialaccount_set.first().socialtoken_set.first()
            jobs.run_flow_job.delay(
                token,
                serializer.validated_data['instance_url'],
                serializer.validated_data['package_url'],
                serializer.validated_data['flow_name'],
            )
            return Response('', status=status.HTTP_202_ACCEPTED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
