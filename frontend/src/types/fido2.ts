export interface Fido2Credential {
  id?: string;
  name?: string;
  displayName?: string;
  enabled?: boolean;
  created?: string;
  lastModified?: string;
  // backend often returns provider specific metadata; keep conservative shape for now
  meta?: Record<string, unknown> | any;
}

export interface GetUserFido2Response {
  fido2?: Fido2Credential[];
}

// TODO: Tighten the shapes above based on real backend API contracts (e.g. created timestamp format, meta fields)
