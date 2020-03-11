import logging

from django.conf import settings
from parler.models import TranslatableModel

from metadeploy.api.models import Translation

logger = logging.getLogger(__name__)


def update_all_translations(lang):
    """Update all objects' translations from the Translation model"""
    for model in TranslatableModel.__subclasses__():
        if not hasattr(model, "get_translation_strategy"):
            continue
        for obj in model.objects.all():
            update_translations(obj, [lang])


def update_translations(obj, langs=None):
    """Update one object's translations from the Translation model"""
    assert obj.get_current_language() == "en-us"
    strategy, context = obj.get_translation_strategy()
    if langs is None:
        langs = [language["code"][:2] for language in settings.PARLER_LANGUAGES[1]]
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
                if slug.startswith("Install "):
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
