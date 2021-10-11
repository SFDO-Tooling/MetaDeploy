from model_utils.choices import Choices

OK = "ok"
WARN = "warn"
ERROR = "error"
SKIP = "skip"
OPTIONAL = "optional"
HIDE = "hide"
ORGANIZATION_DETAILS = "organization_details"
REDIS_JOB_CANCEL_KEY = "metadeploy:cancel:{id}"
CHANNELS_GROUP_NAME = "{model}.{id}"

ORG_TYPES = Choices("Production", "Scratch", "Sandbox", "Developer")
VERSION_STRING = r"^[a-zA-Z0-9._+-]+$"
STEP_NUM = r"^[\d\./]+$"
SUPPORTED_ORG_TYPES = Choices("Persistent", "Scratch", "Both")
PRODUCT_LAYOUTS = Choices("Default", "Card")