from metadeploy.api.tubular.client import authed_tubular_client

with authed_tubular_client() as tubular_client:
    services = tubular_client.list_services()
    print(f"\n\n>>> {services=}")
