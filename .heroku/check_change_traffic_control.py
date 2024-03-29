from calendar import timegm
from datetime import datetime
import jwt
import logging
import pydantic
import requests
import subprocess
import sys

logger = logging.getLogger()


class CTCSettings(pydantic.BaseSettings):
    ctc_url: str
    ctc_auth_key: str
    ctc_sm_business_name_id: str
    ctc_repo_url: str
    heroku_app_name: str
    heroku_slug_commit: str


settings = CTCSettings()


def call_ctc(endpoint, **kw):
    assertion = jwt.encode(
        {
            "iss": settings.heroku_app_name,
            "exp": timegm(datetime.utcnow().utctimetuple()),
        },
        settings.ctc_auth_key,
        algorithm="HS256",
    )
    headers = {"Authorization": f"Bearer {assertion}"}
    response = requests.post(
        endpoint,
        **kw,
        headers=headers,
    )
    response.raise_for_status()
    result = response.json()
    if "error" in result:
        raise Exception(result["error"])
    return result


def check_change_traffic_control():
    source_url = f"{settings.ctc_repo_url}/commit/{settings.heroku_slug_commit}"
    logger.info(f"Checking change traffic control for {source_url}")

    # find Case and start implementation step
    result = call_ctc(
        f"{settings.ctc_url}/case/match-and-start",
        params={
            "sm_business_name_id": settings.ctc_sm_business_name_id,
            "source_url": source_url,
        },
    )
    case_id = result["case_id"]
    step_id = result["implementation_step_id"]

    # run migration
    success = False
    status = "Rolled back - with no impact"
    try:
        p = subprocess.run(args=["python", "manage.py", "migrate", "--noinput"])
        success = not p.returncode
        status = "Implemented - per plan" if success else "Rolled back - with no impact"
    finally:
        # stop implementation step
        logger.info(f"Updating implementation step status to: {status}")
        call_ctc(
            f"{settings.ctc_url}/implementation/{step_id}/stop",
            params={"status": status},
        )
        # if successful, close the case
        logger.info(f"Closing case: {case_id}")
        call_ctc(
            f"{settings.ctc_url}/case/{case_id}/close",
        )

        # if not successful, propagate the return code
        # so we abort the release phase if the migration failed.
        if not success:
            sys.exit(1)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    check_change_traffic_control()
