import { GcdsDetails } from "@gcds-core/components-react";
import { useParams } from "react-router";
import { AVAILABLE_LANGUAGES } from "../../../utils/constants";
import { APPROVED_DOCUMENTS } from "../data/approvedDocuments";

interface AcceptableIdsDetailsProps {
  detailsTitle: string;
  acceptableIds?: string[];
}

export default function AcceptableIdsDetails({
  detailsTitle,
  acceptableIds,
}: AcceptableIdsDetailsProps) {
  const { language } = useParams();
  const currentLanguage =
    language === AVAILABLE_LANGUAGES.fr
      ? AVAILABLE_LANGUAGES.fr
      : AVAILABLE_LANGUAGES.en;

  const defaultAcceptableIds = APPROVED_DOCUMENTS.filter(
    (doc: typeof APPROVED_DOCUMENTS[number]) => doc.value !== "noIds",
  ).map((doc: typeof APPROVED_DOCUMENTS[number]) => doc.labels[currentLanguage]);

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
