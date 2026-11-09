import {
  GcdsButton,
  GcdsText,
  GcdsContainer,
  GcdsHeading,
} from "@gcds-core/components-react";

import { useNavigate, useParams } from "react-router";
import { PAGES } from "../../../utils/constants";
import { path } from "../../../utils/routeHelpers";

export default function IDVInProgress() {
  const navigate = useNavigate();
  const { language, journeyType } = useParams();
  const iDVSuccessPage = path(PAGES.idvDetailsConfirmationPage, {
    language,
    journeyType,
  });

  const handleNavigation = async () => {
    navigate(iDVSuccessPage);
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