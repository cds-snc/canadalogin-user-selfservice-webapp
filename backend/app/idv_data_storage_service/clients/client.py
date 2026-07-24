from app.idv_data_storage_service.clients.base import OutboundIDVClient
from app.idv_data_storage_service.clients.claims import ClaimsClientMixin
from app.idv_data_storage_service.clients.metadata import MetadataClientMixin
from app.idv_data_storage_service.clients.subjects import SubjectsClientMixin
from app.idv_data_storage_service.clients.validations import ValidationsClientMixin


class IDVDataServiceClient(
    MetadataClientMixin,
    SubjectsClientMixin,
    ValidationsClientMixin,
    ClaimsClientMixin,
    OutboundIDVClient,
):
    """Composed client exposing grouped IDV Data Service endpoint methods."""
