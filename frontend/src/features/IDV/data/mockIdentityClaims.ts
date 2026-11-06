import type { IdentityVerificationClaimsResponse } from "../api/identityVerificationApi";

export const mockIdentityClaims: IdentityVerificationClaimsResponse = {
  case_id: "mock-qr-proofing",
  status: "verified",
  verified_claims: {
    verification: {
      time: "2026-10-27T12:00:00Z",
    },
    claims: {
      given_name: "Alex",
      family_name: "Morgan",
      birthdate: "1992-08-14",
      address: {
        formatted: "123 Example Street, Ottawa, ON K1A 0B1, Canada",
      },
    },
  },
  source_display: {
    documents: [
      {
        display_name: {
          en: "Ontario driver's licence: Expires August 14, 2030",
          fr: "Permis de conduire de l’Ontario : Expire le 14 août 2030",
        },
      },
    ],
  },
};
