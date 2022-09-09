from client import authed_tubular_client
from constants import GITHUB_TOKEN

with authed_tubular_client() as client:
    org_config = {"oauth2_client": "sf"}
    client.create_service("oauth2_client", "sf", config=org_config)
    client.create_service(
        "github",
        "public",
        config={
            "username": "Br4nd0R",
            "token": GITHUB_TOKEN,
            "email": "brandon.parker@salesforce.com",
        },
    )
