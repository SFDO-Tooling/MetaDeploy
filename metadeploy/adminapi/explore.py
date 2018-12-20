""" For remembering what a ViewSet does... """

from rest_framework import serializers, viewsets

from metadeploy.api.models import Product


class ProductSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)

    class Meta:
        model = Product
        fields = "__all__"


class ExplorerViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    queryset = Product.objects.all()
    model_name = "xProduct"  # required for routernonsense

    """
    A ModelViewSet is a GenericViewSet with Create,Retrieve,Update,Destroy,list
    ViewSetMixin:
        ViewSet.as_view

    GenericAPIView(APIView): #don't need to worry too hard about APIView, it's "Right"
        - queryset = None
        - serializer_class = None
        - lookup_field ='pk'
        - lookup_url_kwarg = None
        - filter_backends = [settingsDEFAULT]
        - pagination_class = settingsDEFAULT

        - get_queryset()
        - get_object()
            - filter_queryset(get_queryset())
            - get_object_or_404(queryset, {lookup_field: self.kwargs[lookup_url_kwarg]})
            - check_object_permissions(self.request, object)
        - get_serializer()
            - get_serializer_context()
            - get_serializer_class()
        - get_paginated_response()
            - paginator property created from pagination_class

    Mixins:
        - create
            - get serializer
            - serialzier is valid
            - perform_create() (just save())
            - get_success_headers()
            - return Response

        - list
            - filter_queryset
            - paginate_queryset
            - get_serializer(page, many=true)
            - get paginated response(serializer.data)

        -  retrieve
            - get_object, get_serializer, response(serializer.data)
        - update
            - get serializer
            - is valid
            - perform_update()
            - respond

        - destroy
            - get_object
            - perform_destory
            - no serializer

    """
