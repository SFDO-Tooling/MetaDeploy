from metadeploy.api.tubular.client import authed_tubular_client

steps = [{"task": "util_sleep", "options": {"seconds": 10}}]
with authed_tubular_client() as client:
    client.run_job_and_wait(steps, services={}, payload=None)
