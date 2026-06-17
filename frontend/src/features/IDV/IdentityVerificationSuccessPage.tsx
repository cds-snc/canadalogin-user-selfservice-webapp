import { GcdsContainer } from "@gcds-core/components-react";
import IdentityInfoSuccessNotice from "./IdentityInfoSuccessNotice";

export default function IdentityVerificationSuccessPage() {
  return (
    <GcdsContainer role="main">
      <IdentityInfoSuccessNotice show={true} />
    </GcdsContainer>
  );
}
