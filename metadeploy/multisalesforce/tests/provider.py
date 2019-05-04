from ..provider import MetaDeployProviderMixin


def test_get_auth_params():
    class ParentClass:
        def get_auth_params(self, request, action):
            return {}

    class ChildClass(MetaDeployProviderMixin, ParentClass):
        pass

    result = ChildClass().get_auth_params(None, None)
    assert "prompt" in result and result["prompt"] == "login"


def test_extract_uid():
    provider = MetaDeployProviderMixin()
    result = provider.extract_uid({"organization_id": "ORG", "user_id": "USER"})
    assert result == "ORG/USER"
