from django.conf import settings
from drf_spectacular.generators import EndpointEnumerator, SchemaGenerator


class MetaDeployEndpointEnumerator(EndpointEnumerator):
    """Don't include the Tenant Admin API in the schema and documentation"""

    def should_include_endpoint(self, path, callback):
        if path.startswith(f"/{settings.TENANT_AREA_PREFIX}"):
            return False
        return super().should_include_endpoint(path, callback)


# Enable this generator in the DRF Spectacular settings to apply the inspector class
class MetaDeploySchemaGenerator(SchemaGenerator):
    endpoint_inspector_cls = MetaDeployEndpointEnumerator
