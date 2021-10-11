from django.db import models
from hashid_field import HashidAutoField
from sfdo_template_helpers.fields import MarkdownField as BaseMarkdownField


class HashIdMixin(models.Model):
    class Meta:
        abstract = True

    id = HashidAutoField(primary_key=True)


class MarkdownField(BaseMarkdownField):
    def __init__(self, *args, **kwargs):
        kwargs["property_suffix"] = kwargs.get("property_suffix", "_markdown")
        kwargs["blank"] = kwargs.get("blank", True)
        kwargs["help_text"] = kwargs.get("help_text", "Markdown is supported")
        super().__init__(*args, **kwargs)


class DottedArray(models.Func):
    """Turns a step number into an array of ints for sorting.

    The step number must be a string including positive integers separated by / and .

    / will be encoded as |-2|
    . will be encoded as |-1|
    Then we can split on | to get an array of ints
    """

    function = "string_to_array"
    template = (
        "%(function)s(replace(replace(%(expressions)s, '.', '|-2|')"
        ", '/', '|-1|'), '|')::int[]"
    )
