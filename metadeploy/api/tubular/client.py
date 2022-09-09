from calendar import timegm
from contextlib import contextmanager
import datetime
import json
import time
import httpx
import jwt
from dataclasses import dataclass
import io
import zipfile
import typing as T

from metadeploy.api.tubular.constants import PRIVATE_KEY

API_VERSION = "v1"
AUTH_ENDPOINT = "/auth/token"
PAYLOAD_ENDPOINT = "/payload"
SERVICE_ENDPOINT = "/service"
JOB_ENDPOINT = "/job"


@dataclass
class File:
    filename: str
    data: str


@dataclass
class Payload:
    id: str


@dataclass
class Job:
    client: "TubularClient"
    id: str

    def get_status(self):
        response = self.client.get_job_state(self.id)
        return response["status"]


def verbose_raise_for_status(response):
    if not 200 <= response.status_code < 300:
        print(response.text)
        print(response.json())
    response.raise_for_status()


class TubularClient:
    def __init__(self, client_id: str, base_url: str, private_key: str, user_id: str):
        self.base_url = f"{base_url}/{API_VERSION}"
        self.client = httpx.Client(base_url=self.base_url)
        self.client_id = client_id
        self.private_key = private_key
        self.user_id = user_id

    def authenticate(self):
        jwt_encoded_payload = self._get_jwt_encoded_payload()
        headers = {"Content-Type": "application/x-www-form-urlencoded"}
        body = (
            "grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion="
            + jwt_encoded_payload
        )
        response = self.client.post(url=AUTH_ENDPOINT, data=body, headers=headers)
        verbose_raise_for_status(response)
        response.raise_for_status()  # maybe VPN or auth problem!

        auth_data = response.json()
        access_token = auth_data["access_token"]
        # use access token on subsequent requests
        self.client.headers["Authorization"] = f"Bearer {access_token}"

    def close(self):
        """shutdown the httpx.Client"""
        self.client.close()

    def _get_jwt_encoded_payload(self):
        payload = self._get_auth_payload()
        return jwt.encode(
            payload,
            self.private_key,
            algorithm="RS256",
        )

    def _get_auth_payload(self) -> dict:
        now = datetime.datetime.utcnow()
        soon = now + datetime.timedelta(seconds=60)
        utctime = timegm(soon.utctimetuple())
        return {
            "alg": "RS256",
            "iss": self.client_id,
            "sub": self.user_id,
            "aud": f"{self.base_url}{AUTH_ENDPOINT}",
            "exp": utctime,
        }

    def create_payload(self, files: T.Sequence[File]):
        buffer = io.BytesIO()
        zf = zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED)
        for file in files:
            zf.writestr(file.filename, file.data)
        zf.close()
        buffer.seek(0)
        response = self.client.post(PAYLOAD_ENDPOINT, files={"payload": buffer})
        verbose_raise_for_status(response)
        payload_id = response.json()["id"]
        return Payload(payload_id)

    def create_payload_from_zip(self, buffer: io.BytesIO):
        buffer.seek(0)
        response = self.client.post(PAYLOAD_ENDPOINT, files={"payload": buffer})
        verbose_raise_for_status(response)
        payload_id = response.json()["id"]
        return Payload(payload_id)

    def create_service(
        self,
        service_type: str,
        name: str,
        config: dict,
    ):
        service_config = {"service_type": service_type, "name": name, "config": config}

        self.client.post(
            SERVICE_ENDPOINT,
            json=service_config,
        )

    def list_services(self):
        response = self.client.get(SERVICE_ENDPOINT)
        verbose_raise_for_status(response)
        return response.json()

    def create_job(
        self,
        steps: T.Sequence[dict],
        services: T.Mapping[str, str],
        payload: Payload = None,
    ):
        payload_id = payload.id if payload else None
        job = {"steps": steps, "services": services, "payload_id": payload_id}
        response = self.client.post(JOB_ENDPOINT, json=job)
        verbose_raise_for_status(response)
        job_id = response.json()["id"]
        return Job(self, job_id)

    def get_job_state(self, job_id: str):
        response = self.client.get(f"{JOB_ENDPOINT}/{job_id}", timeout=30)
        verbose_raise_for_status(response)
        return response.json()

    def run_job_and_wait(self, steps, services, payload):
        job = self.create_job(steps, services, payload)

        status = None
        for _ in range(3000):
            time.sleep(1)
            status = job.status
            if status == "errored":
                print(self.get_job_state(job.id))
                break
            if status == "complete":
                break
        print(
            f"Job ({job}) completed with status: {job.status}{self.get_job_state(job.id)}"
        )
        return
