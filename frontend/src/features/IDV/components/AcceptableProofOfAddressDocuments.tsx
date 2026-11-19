import { GcdsDetails } from "@gcds-core/components-react";
import { useTranslation } from "react-i18next";
import { PROOF_OF_ADDRESS_DOCUMENTS } from "../data/proofOfAddressDocuments";

interface AcceptableProofOfAddressDocumentsProps {
  detailsTitle: string;
}

export default function AcceptableProofOfAddressDocuments({
  detailsTitle,
}: AcceptableProofOfAddressDocumentsProps) {
  const { t } = useTranslation("idv");

  return (
    <GcdsDetails detailsTitle={detailsTitle}>
      <ul aria-label={detailsTitle}>
        {PROOF_OF_ADDRESS_DOCUMENTS.map((document) => (
          <li key={document}>
            {t(`CanadaPostProofOfAddress.options.${document}`)}
          </li>
        ))}
      </ul>
    </GcdsDetails>
  );
}
