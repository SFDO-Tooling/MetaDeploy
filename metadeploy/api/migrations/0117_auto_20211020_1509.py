# Generated by Django 3.1.13 on 2021-10-20 15:09

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0116_auto_20211006_1833"),
    ]

    operations = [
        migrations.AddField(
            model_name="plantemplate",
            name="regression_test_opt_out",
            field=models.BooleanField(default=False),
        ),
    ]
