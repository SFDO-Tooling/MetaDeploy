# Generated by Django 3.2.13 on 2022-07-01 18:36

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0120_auto_20220527_1507"),
    ]

    operations = [
        migrations.AddField(
            model_name="producttranslation",
            name="tags",
            field=models.JSONField(default=list, help_text="JSON array of strings"),
        ),
        migrations.AddField(
            model_name="siteprofile",
            name="show_product_tags",
            field=models.BooleanField(default=True),
        ),
    ]