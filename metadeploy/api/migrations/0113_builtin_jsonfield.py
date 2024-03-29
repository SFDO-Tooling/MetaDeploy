# Generated by Django 3.1.12 on 2021-07-29 19:54

import django.core.serializers.json
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0112_merge_20201130_1757"),
    ]

    operations = [
        migrations.AlterField(
            model_name="job",
            name="results",
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AlterField(
            model_name="plan",
            name="preflight_checks",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AlterField(
            model_name="preflightresult",
            name="results",
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AlterField(
            model_name="scratchorg",
            name="config",
            field=models.JSONField(
                blank=True,
                encoder=django.core.serializers.json.DjangoJSONEncoder,
                null=True,
            ),
        ),
        migrations.AlterField(
            model_name="step",
            name="source",
            field=models.JSONField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name="step",
            name="task_config",
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AlterField(
            model_name="user",
            name="first_name",
            field=models.CharField(
                blank=True, max_length=150, verbose_name="first name"
            ),
        ),
    ]
