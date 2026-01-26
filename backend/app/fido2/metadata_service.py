"""
FIDO2 Metadata Service for querying passkey metadata by AAGUID
"""

import logging
import threading
import time
from pathlib import Path
from typing import Dict, Any, Union
from fastapi import HTTPException
import httpx
from fido2.mds3 import parse_blob, MetadataBlobPayloadEntry

logger = logging.getLogger(__name__)

# FIDO Alliance MDS3 endpoint
MDS3_URL = "https://mds3.fidoalliance.org/"
# GlobalSign R3 root certificate URL
GLOBALSIGN_ROOT_CERT_URL = "https://secure.globalsign.com/cacert/root-r3.crt"

# Local cache settings
CACHE_DIR = Path("mds3_cache")
BLOB_FILE_PATH = CACHE_DIR / "blob.jwt"
CERT_FILE_PATH = CACHE_DIR / "globalsign-r3.crt"
CACHE_MAX_AGE = 24 * 60 * 60  # 24 hours in seconds

# Known AAGUIDs for common devices (used as fallbacks)
APPLE_AAGUID = "adce0002-35bc-c60a-648b-0b25f1f05503"  # Real Apple AAGUID
WINDOWS_HELLO_AAGUID = "08987058-cadc-4b81-b6e1-30de50dcbe96"  # Windows Hello


class FIDO2MetadataService:
    """Service for managing FIDO2 metadata information"""

    def __init__(self):
        self.metadata_cache: Dict[
            str, Union[Dict[str, Any], MetadataBlobPayloadEntry]
        ] = {}
        self.custom_entries: Dict[str, Dict[str, Any]] = {}
        self.mds3_entries: Dict[str, MetadataBlobPayloadEntry] = {}
        self._lock = threading.Lock()
        self._last_mds3_update = 0
        self._mds3_update_interval = 24 * 60 * 60  # 24 hours in seconds
        self._initialize_metadata()
        self._start_refresh_worker()

    def _initialize_metadata(self):
        """Initialize the metadata service with custom entries and MDS3 data"""
        try:
            logger.info("Initializing FIDO metadata service...")

            # Ensure cache directory exists
            CACHE_DIR.mkdir(exist_ok=True)

            # Add custom metadata for known devices (fallbacks)
            # self._add_custom_metadata()

            # Try to load MDS3 metadata (download if needed)
            try:
                self._ensure_mds3_blob_cached()
                self._load_mds3_from_cache()
            except Exception as e:
                logger.warning(
                    f"Failed to load MDS3 metadata: {e}. Using custom metadata only."
                )

            # Rebuild cache with both custom and MDS3 data
            self._rebuild_cache()

            logger.info(
                f"FIDO metadata service initialized with {len(self.metadata_cache)} entries"
            )

        except Exception as e:
            logger.error(f"Failed to initialize metadata service: {e}")
            # Ensure we have at least custom metadata
            # self._add_custom_metadata()
            self._rebuild_cache()

    def _add_custom_metadata(self):
        """Add custom metadata entries for known devices"""

        # Apple Platform Authenticator (Touch ID/Face ID)
        apple_metadata = {
            "aaguid": APPLE_AAGUID,
            "description": "Apple Platform Authenticator (Touch ID/Face ID)",
            "icon": "https://developer.apple.com/assets/elements/icons/touch-id/touch-id-96x96_2x.png",
            "authenticatorVersion": 1,
            "protocolFamily": "fido2",
            "attestationTypes": ["none"],
            "keyProtection": ["hardware", "secure_element"],
            "matcherProtection": ["on_chip"],
            "userVerificationDetails": [
                [
                    {"userVerificationMethod": "fingerprint_internal"},
                    {"userVerificationMethod": "faceprint_internal"},
                ]
            ],
            "attachmentHint": ["platform"],
            "supportedExtensions": [],
            "statusReports": [
                {"status": "FIDO_CERTIFIED", "effectiveDate": "2020-01-01"}
            ],
            "is_known": True,
            "is_custom": True,
        }

        # Windows Hello
        windows_metadata = {
            "aaguid": WINDOWS_HELLO_AAGUID,
            "description": "Windows Hello",
            "icon": None,
            "authenticatorVersion": 1,
            "protocolFamily": "fido2",
            "attestationTypes": ["none"],
            "keyProtection": ["hardware", "tee"],
            "matcherProtection": ["on_chip"],
            "attachmentHint": ["platform"],
            "supportedExtensions": [],
            "statusReports": [
                {"status": "FIDO_CERTIFIED", "effectiveDate": "2018-01-01"}
            ],
            "is_known": True,
            "is_custom": True,
        }

        with self._lock:
            self.metadata_cache[APPLE_AAGUID] = apple_metadata
            self.metadata_cache[WINDOWS_HELLO_AAGUID] = windows_metadata

            self.custom_entries[APPLE_AAGUID] = apple_metadata
            self.custom_entries[WINDOWS_HELLO_AAGUID] = windows_metadata

        logger.info(f"Added {len(self.custom_entries)} custom metadata entries")

    def _is_blob_cache_fresh(self) -> bool:
        """Check if the cached blob file is fresh (less than 24 hours old)"""
        if not BLOB_FILE_PATH.exists():
            return False

        file_age = time.time() - BLOB_FILE_PATH.stat().st_mtime
        return file_age < CACHE_MAX_AGE

    def _is_cert_cache_fresh(self) -> bool:
        """Check if the cached certificate file is fresh (less than 24 hours old)"""
        if not CERT_FILE_PATH.exists():
            return False

        file_age = time.time() - CERT_FILE_PATH.stat().st_mtime
        return file_age < CACHE_MAX_AGE

    def _download_globalsign_cert(self) -> bool:
        """Download the GlobalSign R3 root certificate"""
        try:
            logger.info("Downloading GlobalSign R3 root certificate...")

            with httpx.Client(timeout=30.0, follow_redirects=True) as client:
                response = client.get(GLOBALSIGN_ROOT_CERT_URL)
                response.raise_for_status()

                # Save the certificate to cache (DER format)
                with open(CERT_FILE_PATH, "wb") as f:
                    f.write(response.content)

                logger.info(
                    f"Downloaded certificate ({len(response.content)} bytes) to {CERT_FILE_PATH}"
                )
                return True

        except Exception as e:
            logger.error(f"Failed to download GlobalSign certificate: {e}")
            return False

    def _ensure_cert_cached(self) -> bytes:
        """Ensure we have a fresh certificate and return its contents"""
        # Try to use cached certificate if it's fresh
        if self._is_cert_cache_fresh():
            logger.info("Using cached GlobalSign certificate")
            with open(CERT_FILE_PATH, "rb") as f:
                return f.read()

        # Try to download fresh certificate
        if self._download_globalsign_cert():
            with open(CERT_FILE_PATH, "rb") as f:
                return f.read()

        # Check if we have any cached certificate (even if stale)
        if CERT_FILE_PATH.exists():
            logger.warning(
                "Using stale cached GlobalSign certificate - download failed"
            )
            with open(CERT_FILE_PATH, "rb") as f:
                return f.read()

        # No certificate available
        raise Exception(
            "No GlobalSign certificate available. "
            "Unable to download certificate and no cached version found."
        )

    def _download_mds3_blob(self) -> bool:
        """Download the MDS3 blob and save it to local cache"""
        try:
            logger.info("Downloading MDS3 blob from FIDO Alliance...")

            with httpx.Client(timeout=30.0, follow_redirects=True) as client:
                response = client.get(MDS3_URL)
                response.raise_for_status()

                # Save the blob to cache
                with open(BLOB_FILE_PATH, "wb") as f:
                    f.write(response.content)

                logger.info(
                    f"Downloaded MDS3 blob ({len(response.content)} bytes) to {BLOB_FILE_PATH}"
                )
                return True

        except httpx.HTTPStatusError as e:
            if e.response.status_code == 429:
                logger.warning("Rate limited by FIDO Alliance MDS3 service")
            else:
                logger.warning(
                    f"HTTP error {e.response.status_code} downloading MDS3 blob"
                )
            return False
        except Exception as e:
            logger.error(f"Failed to download MDS3 blob: {e}")
            return False

    def _ensure_mds3_blob_cached(self):
        """Ensure we have a fresh MDS3 blob cached locally"""
        if not self._is_blob_cache_fresh():
            logger.info("MDS3 blob cache is stale or missing, downloading...")
            success = self._download_mds3_blob()
            if not success and not BLOB_FILE_PATH.exists():
                raise Exception("No cached blob available and download failed")
        else:
            logger.info("Using cached MDS3 blob")

    def _load_mds3_from_cache(self):
        """Load and parse MDS3 metadata from cached blob file"""
        try:
            logger.info("Loading MDS3 metadata from cached blob...")

            # Read the cached blob file
            with open(BLOB_FILE_PATH, "rb") as f:
                blob_jwt = f.read()

            logger.info(f"Loaded blob from cache: {len(blob_jwt)} bytes")

            # Get the certificate (download if needed, or use cached/embedded)
            cert_bytes = self._ensure_cert_cached()

            # Parse the blob with the root certificate
            blob_payload = parse_blob(blob_jwt, cert_bytes)
            logger.info(
                f"Successfully parsed MDS3 blob with {len(blob_payload.entries)} entries"
            )

            # Store native MDS3 entry objects directly - no conversion needed!
            mds3_entries = {}
            for entry in blob_payload.entries:
                if entry.aaguid:  # Only process entries with AAGUIDs
                    aaguid = str(entry.aaguid).lower()
                    mds3_entries[aaguid] = entry

            with self._lock:
                self.mds3_entries = mds3_entries
                self._last_mds3_update = time.time()

            logger.info(f"Processed {len(mds3_entries)} MDS3 entries with AAGUIDs")

        except Exception as e:
            logger.error(f"Failed to load MDS3 from cache: {e}")
            raise

    def _rebuild_cache(self):
        """Rebuild the metadata cache from custom and MDS3 entries"""
        with self._lock:
            # Start with MDS3 entries (larger set) and override with custom entries (higher priority)
            # This is more efficient than iterating through the larger MDS3 set
            self.metadata_cache = {**self.mds3_entries, **self.custom_entries}

            logger.info(f"Cache rebuilt with {len(self.metadata_cache)} total entries")

    def get_metadata(
        self, aaguid: str
    ) -> Union[Dict[str, Any], MetadataBlobPayloadEntry]:
        """Get metadata for a specific AAGUID"""
        if not aaguid:
            raise HTTPException(status_code=400, detail="AAGUID is required")

        # Normalize AAGUID format
        aaguid_normalized = aaguid.lower().strip()

        with self._lock:
            # Check if we have metadata for this AAGUID
            if aaguid_normalized in self.metadata_cache:
                return self.metadata_cache[aaguid_normalized]

            # Return a basic fallback response for unknown AAGUIDs
            return {
                "aaguid": aaguid_normalized,
                "description": "Unknown Authenticator",
                "icon": None,
                "is_known": False,
                "is_custom": False,
            }

    def get_all_known_aaguids(self) -> Dict[str, str]:
        """Get a list of all known AAGUIDs with their descriptions"""
        with self._lock:
            result = {}
            for aaguid, metadata in self.metadata_cache.items():
                if (
                    hasattr(metadata, "metadata_statement")
                    and metadata.metadata_statement
                ):
                    # Native MDS3 object
                    description = getattr(
                        metadata.metadata_statement,
                        "description",
                        "FIDO2 Authenticator",
                    )
                elif isinstance(metadata, dict) and "description" in metadata:
                    # Custom dict entry
                    description = metadata["description"]
                else:
                    description = "FIDO2 Authenticator"
                result[aaguid] = description
            return result

    def get_metadata_stats(self) -> Dict[str, Any]:
        """Get statistics about the metadata cache"""
        with self._lock:
            total_entries = len(self.metadata_cache)
            custom_entries = len(self.custom_entries)
            mds3_entries = len(self.mds3_entries)

            # Get cache file info
            blob_exists = BLOB_FILE_PATH.exists()
            blob_age = None
            blob_fresh = False

            if blob_exists:
                blob_age = time.time() - BLOB_FILE_PATH.stat().st_mtime

            return {
                "total_entries": total_entries,
                "custom_entries": custom_entries,
                "mds3_entries": mds3_entries,
                "last_mds3_update": self._last_mds3_update,
                "blob_cached": blob_exists,
                "blob_fresh": blob_fresh,
                "blob_age_seconds": blob_age,
            }

    def get_stats(self) -> Dict[str, Any]:
        """Alias for get_metadata_stats"""
        return self.get_metadata_stats()

    def _start_refresh_worker(self):
        """Start background worker to refresh metadata periodically"""

        def refresh_worker():
            while True:
                try:
                    # Wait 1 hour before first refresh, then check hourly
                    time.sleep(60 * 60)  # 1 hour

                    # Check if we need to refresh (blob is older than 24 hours)
                    if not self._is_blob_cache_fresh():
                        logger.info("Refreshing FIDO MDS3 metadata...")
                        try:
                            if self._download_mds3_blob():
                                self._load_mds3_from_cache()
                                self._rebuild_cache()
                                logger.info("MDS3 metadata refreshed successfully")
                            else:
                                logger.warning(
                                    "Failed to refresh MDS3 metadata, using existing cache"
                                )
                        except Exception as e:
                            logger.error(f"Error during MDS3 refresh: {e}")
                    else:
                        logger.debug("MDS3 blob is still fresh, skipping refresh")

                except Exception as e:
                    logger.error(f"Metadata refresh failed: {e}")
                    # Continue running even if refresh fails

        thread = threading.Thread(target=refresh_worker, daemon=True)
        thread.start()
        logger.info("Metadata refresh worker started")


# Global instance
metadata_service = FIDO2MetadataService()
