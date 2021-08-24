from calendar import timegm
from datetime import datetime
import jwt
import logging
import pydantic
import requests

logger = logging.getLogger()


class CTCSettings(pydantic.BaseSettings):
    ctc_url: str
    ctc_auth_key: str
    ctc_sm_business_name_id: str
    ctc_repo_url: str
    heroku_app_name: str
    heroku_slug_commit: str


def check_change_traffic_control():
    settings = CTCSettings()
    assertion = jwt.encode(
        {
            "iss": settings.heroku_app_name,
            "exp": timegm(datetime.utcnow().utctimetuple()),
        },
        settings.ctc_auth_key,
        algorithm="HS256",
    )
    headers = {"Authorization": f"Bearer {assertion}"}

    # match case and start implementation step
    source_url = f"{settings.ctc_repo_url}/commit/{settings.heroku_slug_commit}"
    response = requests.post(
        f"{settings.ctc_url}/case/match-and-start",
        params={
            "sm_business_name_id": settings.ctc_sm_business_name_id,
            "source_url": source_url,
        },
        headers=headers,
    )
    response.raise_for_status()
    result = response.json()
    if "error" in result:
        raise Exception(result["error"])

    # stop implementation step
    step_id = result["implementation_step_id"]
    response = requests.post(
        f"{settings.ctc_url}/implementation/{step_id}/stop",
        params={"status": "Implemented - per plan"},
        headers=headers,
    )
    response.raise_for_status()
    if "error" in result:
        raise Exception(result["error"])


if __name__ == "__main__":
    check_change_traffic_control()
