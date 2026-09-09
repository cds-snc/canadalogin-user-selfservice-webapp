import type { OtpSentData } from "../types/hooks";

type OtpMetadataCarrier = {
  created?: string;
  expiry?: string;
  trxnId?: string;
};

type OtpMetadataError = {
  data?: OtpMetadataCarrier;
  response?: {
    data?: OtpMetadataCarrier;
  };
};

export type OtpServerMetadata = {
  created?: string;
  expiry?: string;
  trxnId?: string;
};

export function extractOtpServerMetadata(error: unknown): OtpServerMetadata {
  if (!error || typeof error !== "object") {
    return {};
  }

  const otpError = error as OtpMetadataError;
  const payload = otpError.data ?? otpError.response?.data;

  return {
    created: payload?.created,
    expiry: payload?.expiry,
    trxnId: payload?.trxnId,
  };
}

export function hasOtpServerMetadata(metadata: OtpServerMetadata): boolean {
  return Boolean(metadata.created || metadata.expiry || metadata.trxnId);
}

export function mergeOtpSentResponseWithMetadata(
  previous: OtpSentData | null,
  metadata: OtpServerMetadata,
): OtpSentData | null {
  if (!hasOtpServerMetadata(metadata)) {
    return previous;
  }

  const nextTrxnId = metadata.trxnId ?? previous?.trxnId ?? "";
  if (!previous && !nextTrxnId) {
    return previous;
  }

  return {
    ...(previous ?? { trxnId: nextTrxnId }),
    trxnId: nextTrxnId,
    created: metadata.created ?? previous?.created,
    expiry: metadata.expiry ?? previous?.expiry,
  };
}
