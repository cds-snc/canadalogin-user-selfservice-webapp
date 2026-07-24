"""Backward-compatible exports for IDV data service clients."""

from app.idv_data_storage_service.clients import IDVDataServiceClient, OutboundIDVClient

__all__ = ["IDVDataServiceClient", "OutboundIDVClient"]
