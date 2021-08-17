import logging
import pydantic
import requests

logger = logging.getLogger()


class CTCSettings(pydantic.BaseSettings):
    ctc_url: str
    ctc_sm_business_name_id: str
    ctc_repo_url: str
    heroku_slug_commit: str


def check_change_traffic_control():
    settings = CTCSettings()
    source_url = f"{settings.ctc_repo_url}/commit/{settings.heroku_slug_commit}"
    response = requests.get(
        settings.ctc_url,
        params={
            "sm_business_name_id": settings.ctc_sm_business_name_id,
            "source_url": source_url,
        },
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
