from django import template
from django.contrib.sites.models import Site
from django.template.loader import get_template

register = template.Library()


@register.simple_tag(takes_context=True)
def site_selector(context, template="includes/site_selector.html"):
    """
    Render a dropdown to select a different Site
    """
    if Site.objects.count() < 2:  # pragma: nocover
        return ""
    context["sites"] = Site.objects.all()
    return get_template(template).render(context.flatten())
