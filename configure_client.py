import os
from pathlib import Path

os.system(
    "openssl req -newkey rsa:2048 -nodes -keyout myclient.key -x509 -days 365 -out myclient.crt"
)

assert Path("myclient.key").exists()

with open("myclient.crt", "r") as raw_cert_data:
    cert_data = raw_cert_data.read().replace("\n", "\\n")

print(
    """
You now have a myclient.key which the client app can use to sign messages.
You need to configure the server to know about the client by creating an
environment variable like this:
export TUBULAR_CLIENTS='{
        "swagger":{
            "client_id": "swagger",
            "redirect_uri": "http://localhost:5000/docs/oauth2-redirect"
        },
        "myclient":{
            "client_id":"myclient",
            "scopes": ["customer"],
            "grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer",
            "cert": "%s"
        }
}'
After adding the above to your environment (e.g. through .envrc and `direnv allow`),
restart the server if it is running.
"""
    % cert_data
)
