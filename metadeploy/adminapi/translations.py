import logging
import re

from django.conf import settings
from parler.models import TranslatableModel

from metadeploy.api.jobs import job
from metadeploy.api.models import Translation

logger = logging.getLogger(__name__)


INSTALL_VERSION_RE = re.compile(r"^Install .*\d$")


@job
def update_all_translations(lang):
    """Update all objects' translations from the Translation model"""
    for model in TranslatableModel.__subclasses__():
        for obj in model.objects.all():
            update_translations(obj, [lang])


def update_translations(obj, langs=None):
    """Update one object's translations from the Translation model"""
    # Make sure we were pased an object in the default language
    assert obj.get_current_language() == settings.LANGUAGE_CODE
    strategy, context = obj.get_translation_strategy()
    if langs is None:
        langs = [code for code, label in settings.LANGUAGES]
    for lang in langs:
        values = {}
        if strategy == "fields":
            values = {
                t.slug: t.text
                for t in Translation.objects.filter(lang=lang, context=context)
            }
        elif strategy == "text":
            for field in obj._parler_meta.get_translated_fields():
                slug = getattr(obj, field)
                product_id = ""
                if INSTALL_VERSION_RE.match(slug):
                    product_id = slug[8:]
                    slug = "Install {product} {version}"
                try:
                    translation = Translation.objects.get(
                        lang=lang, context=context, slug=slug
                    )
                except Translation.DoesNotExist:
                    pass
                else:
                    text = translation.text
                    text = text.replace("{product} {version}", product_id)
                    values[field] = text
        if values:
            logger.info(
                f"Updating translation (model={obj.__class__.__name__}, context={context}, lang={lang}"
            )
            obj.create_translation(lang, **values)
