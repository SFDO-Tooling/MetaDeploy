from collections import namedtuple
from importlib import import_module

from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.apps import apps
from django.core.exceptions import MultipleObjectsReturned, ObjectDoesNotExist
from django.utils.translation import gettext as _

from .api.constants import CHANNELS_GROUP_NAME
from .api.hash_url import convert_org_id_to_key
from .consumer_utils import clear_message_semaphore

Request = namedtuple("Request", ["user", "session"])


KNOWN_MODELS = {"user", "preflightresult", "job", "org", "scratchorg"}


def user_context(user, session):
    return {
        "request": Request(user, session),
    }


class PushNotificationConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        await self.accept()

    async def notify(self, event):
        """
        Handler for calls like::

            channel_layer.group_send(group_name, {
                'type': 'notify',  # This routes it to this handler.
                'group': group_name,
                'content': json_message,
            })
        """
        # Take lock out of redis for this message:
        await clear_message_semaphore(self.channel_layer, event)
        if "content" in event:
            await self.send_json(event["content"])
            return
        if "serializer" in event and "instance" in event and "inner_type" in event:
            instance = self.get_instance(**event["instance"])
            serializer = self.get_serializer(event["serializer"])
            data = serializer(
                instance=instance,
                context=user_context(self.scope["user"], self.scope["session"]),
            ).data
            payload = data
            if "extra_payload" in event and event["extra_payload"]:
                payload = {**event["extra_payload"], "model": data}
            message = {
                "payload": payload,
                "type": event["inner_type"],
            }
            await self.send_json(message)
            return

    def get_instance(self, *, model, id):
        Model = apps.get_model("api", model)
        return Model.objects.get(pk=id)

    def get_serializer(self, serializer_path):
        mod, serializer = serializer_path.rsplit(".", 1)
        return getattr(import_module(mod), serializer)

    async def receive_json(self, content, **kwargs):
        # Just used to subscribe to notification channels.
        is_valid = self.is_valid(content)
        is_known_model = self.is_known_model(content.get("model", None))

        # It seems we don't get the correct (updated) value in the session here in the
        # websocket consumer, after it is set by the scratch_org view in PlanViewSet,
        # so we accept a value from the user to update the session:
        uuid = content.get("uuid", None)
        scratch_org_id = self.scope["session"].get("scratch_org_id", None)
        if uuid and uuid != scratch_org_id:
            self.scope["session"]["scratch_org_id"] = uuid
            self.scope["session"].save()

        has_good_permissions = self.has_good_permissions(content)
        all_good = is_valid and is_known_model and has_good_permissions
        if not all_good:
            await self.send_json({"error": _("Invalid subscription.")})
            return
        group_name = CHANNELS_GROUP_NAME.format(
            model=content["model"], id=content["id"]
        )
        self.groups.append(group_name)
        await self.channel_layer.group_add(group_name, self.channel_name)
        await self.send_json(
            {
                "ok": _("Subscribed to {model}.id = {id_}").format(
                    model=content["model"], id_=content["id"]
                )
            }
        )

    def is_valid(self, content):
        return content.keys() == {"model", "id"} or content.keys() == {
            "model",
            "id",
            "uuid",
        }

    def is_known_model(self, model):
        return model in KNOWN_MODELS

    def has_good_permissions(self, content):
        if content["model"] == "org":
            return self.handle_org_special_case(content)
        possible_exceptions = (
            AttributeError,
            KeyError,
            LookupError,
            MultipleObjectsReturned,
            ObjectDoesNotExist,
            ValueError,
            TypeError,
        )
        try:
            obj = self.get_instance(model=content["model"], id=content["id"])
            return obj.subscribable_by(self.scope["user"], self.scope["session"])
        except possible_exceptions:
            return False

    def handle_org_special_case(self, content):
        content["id"] = convert_org_id_to_key(content["id"])
        # TODO: It seems we don't get the correct value in the session here in the
        # websocket consumer. Ideally we would restrict this to only authenticated
        # users, or users who have a valid scratch_org `uuid` in their session, matching
        # the requested org:
        #
        # if "user" in self.scope and self.scope["user"].is_authenticated:
        #     ret = self.scope["user"].org_id == content["id"]
        # else:
        #     session = self.scope["session"]
        #     scratch_org_id = session.get("scratch_org_id", None)
        #     scratch_org = ScratchOrg.objects.filter(
        #         uuid=scratch_org_id, status=ScratchOrg.Status.complete
        #     ).first()
        #     ret = scratch_org.org_id == content["id"] if scratch_org else False
        # return ret
        #
        # But instead we allow any user to subscribe to org changes:
        return True
