from django.db import models


class ClickThroughAgreement(models.Model):
    text = models.TextField()