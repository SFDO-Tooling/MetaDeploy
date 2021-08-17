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
    heroku_slug_commit: str


def check_change_traffic_control():
    settings = CTCSettings()
    assertion = jwt.encode(
        {"exp": timegm(datetime.utcnow().utctimetuple())},
        settings.ctc_auth_key,
        algorithm="HS256",
    )
    source_url = f"{settings.ctc_repo_url}/commit/{settings.heroku_slug_commit}"
    response = requests.get(
        settings.ctc_url,
        params={
            "sm_business_name_id": settings.ctc_sm_business_name_id,
            "source_url": source_url,
        },
        headers={"Authorization": f"Bearer {assertion}"},
    )
    response.raise_for_status()
    result = response.json()
    if "error" in result:
        raise Exception(result["error"])


if __name__ == "__main__":
    try:
        check_change_traffic_control()
    except Exception:
        # temporary until I know it works
        logger.exception("Failed to check change traffic control")
        pass
