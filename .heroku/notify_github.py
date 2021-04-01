import sys

from cumulusci.core.github import get_github_api_for_repo


def notify_of_release(owner, name):
    # Dispatch a heroku-release-phase event to the github repository
    gh = get_github_api_for_repo(None, owner, name)
    repo = gh.repository(owner, name)
    url = repo._build_url("dispatches", base_url=repo._api)
    data = {"event_type": "heroku-release-phase"}
    repo._post(url, data=data)


if __name__ == "__main__":
    repo = sys.argv[1]
    owner, name = repo.split("/")
    notify_of_release(owner, name)
