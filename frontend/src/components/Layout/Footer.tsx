import { GcdsContainer, GcdsFooter } from "@gcds-core/components-react";
import { getFooter } from "../../utils/functions";

interface FooterProps {
  currentLang: string;
}

export default function Footer({ currentLang }: FooterProps) {
  return (
    <GcdsContainer className="gcds-footer">
      <GcdsFooter display="compact" subLinks={getFooter(currentLang)} />
    </GcdsContainer>
  );
}
