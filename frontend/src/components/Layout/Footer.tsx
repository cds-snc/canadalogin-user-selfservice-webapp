import { GcdsContainer, GcdsFooter } from "@cdssnc/gcds-components-react";
import { getFooter } from "../../utils/functions";

export default function Footer({ currentLang }) {
  return (
    <GcdsContainer className="gcds-footer">
      <GcdsFooter display="compact" subLinks={getFooter(currentLang)} />
    </GcdsContainer>
  );
}
