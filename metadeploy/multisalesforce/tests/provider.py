from ..provider import PromptLoginMixin


def test_get_auth_params():
    class ParentClass:
        def get_auth_params(self, request, action):
            return {}

    class ChildClass(PromptLoginMixin, ParentClass):
        pass

    result = ChildClass().get_auth_params(None, None)
    assert "prompt" in result and result["prompt"] == "login"
