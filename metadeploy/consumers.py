from collections import namedtuple

from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.apps import apps
from django.core.exceptions import MultipleObjectsReturned, ObjectDoesNotExist

Request = namedtuple("Request", "user")


KNOWN_MODELS = {"user", "preflightresult", "job"}


def user_context(user):
    return {"request": Request(user)}


class PushNotificationConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        if self.scope["user"].is_anonymous:
            await self.close()
        else:
            await self.accept()

    async def notify(self, event):
        """
        Handler for calls like::

            channel_layer.group_send(group_name, {
                'type': 'notify',  # This routes it to this handler.
                'content': json_message,
            })
        """
        if "content" in event:
            await self.send_json(event["content"])
            return
        if "serializer" in event and "instance" in event and "inner_type" in event:
            instance = self.get_instance(**event["instance"])
            serializer = event["serializer"]
            payload = {
                "payload": serializer(
                    instance=instance, context=user_context(self.scope["user"])
                ).data,
                "type": event["inner_type"],
            }
            await self.send_json(payload)
            return

    def get_instance(self, *, model, id):
        Model = apps.get_model("api", model)
        return Model.objects.get(pk=id)

    async def receive_json(self, content, **kwargs):
        # Just used to subscribe to notification channels.
        is_valid = self.is_valid(content)
        is_known_model = self.is_known_model(content.get("model", None))
        has_good_permissions = self.has_good_permissions(content)
        all_good = is_valid and is_known_model and has_good_permissions
        if not all_good:
            await self.send_json({"error": "Invalid subscription."})
            return
        group_name = f"{content['model']}-{content['id']}"
        self.groups.append(group_name)
        await self.channel_layer.group_add(group_name, self.channel_name)
        await self.send_json(
            {"ok": f"Subscribed to {content['model']}.id = {content['id']}"}
        )

    def is_valid(self, content):
        return content.keys() == {"model", "id"}

    def is_known_model(self, model):
        return model in KNOWN_MODELS

    def has_good_permissions(self, content):
        possible_exceptions = (
            AttributeError,
            KeyError,
            LookupError,
            MultipleObjectsReturned,
            ObjectDoesNotExist,
            ValueError,
        )
        try:
            obj = self.get_instance(**content)
            return obj.subscribable_by(self.scope["user"])
        except possible_exceptions:
            return False
