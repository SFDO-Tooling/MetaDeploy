import io
import logging
import time

from contextlib import contextmanager
from metadeploy.api.models import Job as MetaDeployJob
from metadeploy.api.push import notify_post_task
from metadeploy.api.tubular.client import Job as TubeJob
from metadeploy.api.tubular.client import TubularClient
from metadeploy.api.tubular.constants import PRIVATE_KEY, TUBULAR_JOB_TIMEOUT

logger = logging.getLogger(__name__)

@contextmanager
def authed_tubular_client():
    client = TubularClient(
        "metadeploy", "http://host.docker.internal:5000", PRIVATE_KEY, "metadeploy-user"
    )
    try:
        client.authenticate()
        yield client
    finally:
        client.close()


def run_job_on_tubular(
    mdp_job: MetaDeployJob,
    iostream: io.BytesIO,
    steps: list[dict],
    org_access_token: str,
):
    """
    mdp_job: The job being run in metadeploy
    iostream: buffer of the tubular payload (ZipFile)
    steps: steps for tubular to run
    org_access_token: an access token for the org that we're operating on

    Runs a job against Tubular and synchronously polls for completion
    """
    logger.info(">>> Authenticating to Tubular as MetaDeploy")
    with authed_tubular_client() as tubular_client:
        logger.info(">>> Creating payload from zipfile")
        payload = tubular_client.create_payload_from_zip(iostream)
        logger.info(f">>> Created payload: {payload.id}")

        # TODO: this should be org_name = f"metadeploy-{uuid4()}"
        # this was so I didn't spam a bunch of org services in my local
        org_name = "metadeploy-org"
        org_config = {
            "access_token": org_access_token,
            "instance_url": mdp_job.user.instance_url,
        }
        logger.info(f">>> Registering org with Tubular: {org_name}")
        tubular_client.create_service("org", org_name, config=org_config)

        logger.info(">>> Starting job on tubular")
        services = {
            "org": [org_name],
            "github": ["public"],
        }
        job = tubular_client.create_job(steps, services, payload)

        # tubu
        poll_for_completion(tubular_client, job, mdp_job)


def poll_for_completion(client: TubularClient, tube_job: TubeJob, mdp_job: MetaDeployJob):
    """Poll a job in tubular until it completes or an error occurs"""
    for _ in range(TUBULAR_JOB_TIMEOUT):
        time.sleep(5)
        state = client.get_job_state(tube_job.id)
        job_status = state['status']
        if job_status == "errored" or job_status == "complete":
            break
        # mdp_job.results = state
        # mdp_job.save()
        mdp_job._push_if_condition(True, notify_post_task)

    job_state = client.get_job_state(tube_job.id)
    mdp_job.log = job_state["log"]
    mdp_job.save()
    logger.info(
        f"Tubular job ({tube_job.id}) completed with status: {job_status}\n{job_state}"
    )
