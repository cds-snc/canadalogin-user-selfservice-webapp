import { GcdsContainer, GcdsFooter } from "@cdssnc/gcds-components-react";
import { getFooter } from "../../utils/functions";
import { ReactNode } from "react";

type FooterProps = {
  currentLang?: string;
};

export default function Footer({ currentLang }: FooterProps) {
  return (
    <GcdsContainer className="gcds-footer">
      <GcdsFooter display="compact" subLinks={getFooter(currentLang)} />
    </GcdsContainer>
  );
}
