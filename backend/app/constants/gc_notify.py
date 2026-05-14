from enum import Enum

GC_NOTIFY_BASE_URL = "https://api.notification.canada.ca"


class GCNotifyTemplateID(str, Enum):
    IN_PERSON_VERIFICATION = "46c59b2f-945c-4d5e-89fd-f085180cdbed"


class GCNotifyEndpoint(str, Enum):
    SEND_EMAIL = "/v2/notifications/email"
