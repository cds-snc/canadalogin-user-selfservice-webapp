import {
  GcdsButton,
  GcdsText,
  GcdsContainer,
  GcdsHeading,
} from "@gcds-core/components-react";

import { useNavigate, useParams, useLocation } from "react-router";
import { PAGES } from "../../../utils/constants";
import { path } from "../../../utils/routeHelpers";

type VerificationMethod =
  "bluink" | "provincial" | "canada_post" | "service_canada";

export default function IDVInProgress() {
  const navigate = useNavigate();
  const { language, journeyType } = useParams();
  const { state } = useLocation();
  const isMockProofing = state?.mockProofing === true;
  const verificationMethod =
    (state?.verificationMethod as VerificationMethod | null) || "provincial";
  const province = state?.province as "BC" | "AB" | "QC" | undefined;
  const mockIdentityClaims = state?.mockIdentityClaims;
  const iDVSuccessPage = path(PAGES.idvDetailsConfirmationPage, {
    language,
    journeyType,
  });

  const handleNavigation = async () => {
    navigate(
      iDVSuccessPage,
      isMockProofing
        ? {
            state: {
              mockProofing: true,
              verificationMethod,
              ...(province && { province }),
              ...(mockIdentityClaims && { mockIdentityClaims }),
            },
          }
        : { state: { verificationMethod, ...(province && { province }) } },
    );
  };

  return (
    <GcdsContainer role="main">
      <GcdsHeading tag="h1">Identity verification in progress</GcdsHeading>
      <GcdsText>
        Please keep this page open. Refreshing or leaving may interrupt your
        verification.
      </GcdsText>
      <GcdsButton
        type="button"
        buttonRole="primary"
        onGcdsClick={handleNavigation}
      >
        Continue
      </GcdsButton>
    </GcdsContainer>
  );
}
