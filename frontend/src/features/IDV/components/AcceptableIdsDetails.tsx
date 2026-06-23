import { GcdsDetails } from "@gcds-core/components-react";
import { useTranslation } from "react-i18next";
import { APPROVED_DOCUMENT_VALUES_WITHOUT_NO_IDS } from "../data/approvedDocuments";

interface AcceptableIdsDetailsProps {
  detailsTitle: string;
  acceptableIds?: string[];
}

export default function AcceptableIdsDetails({
  detailsTitle,
  acceptableIds,
}: AcceptableIdsDetailsProps) {
  const { t } = useTranslation("idv");

  const defaultAcceptableIds = APPROVED_DOCUMENT_VALUES_WITHOUT_NO_IDS.map(
    (docValue) => t(`ApprovedDocuments.${docValue}`),
  );

  const ids =
    acceptableIds && acceptableIds.length > 0
      ? acceptableIds
      : defaultAcceptableIds;

  return (
    <GcdsDetails detailsTitle={detailsTitle}>
      <ul aria-label={detailsTitle}>
        {ids.map((acceptableId: string, index: number) => (
          <li key={`${acceptableId}-${index}`}>{acceptableId}</li>
        ))}
      </ul>
    </GcdsDetails>
  );
}
