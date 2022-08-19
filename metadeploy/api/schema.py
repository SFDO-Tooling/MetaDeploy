from drf_spectacular.generators import EndpointEnumerator, SchemaGenerator


class MetaDeployEndpointEnumerator(EndpointEnumerator):
    """Don't include the admin API in the schema and documentation"""

    def should_include_endpoint(self, path, callback):
        if path.startswith("/admin/rest/"):
            return False
        return super().should_include_endpoint(path, callback)


# Enable this generator in the DRF Spectacular settings to apply the inspector class
class MetaDeploySchemaGenerator(SchemaGenerator):
    endpoint_inspector_cls = MetaDeployEndpointEnumerator
