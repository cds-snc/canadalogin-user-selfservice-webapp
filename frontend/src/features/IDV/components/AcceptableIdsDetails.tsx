import { GcdsDetails } from "@gcds-core/components-react";
import { useTranslation } from "react-i18next";

interface AcceptableIdsDetailsProps {
  detailsTitle: string;
  acceptableIds?: string[];
}

export default function AcceptableIdsDetails({
  detailsTitle,
  acceptableIds,
}: AcceptableIdsDetailsProps) {
  const { t } = useTranslation("idv");

  const defaultAcceptableIds = [
    t("AcceptableIds.driverLicence"),
    t("AcceptableIds.photoIdHealthCard"),
    t("AcceptableIds.photoIdServiceCard"),
    t("AcceptableIds.passport"),
    t("AcceptableIds.prCards"),
    t("AcceptableIds.secureCertificateOfIndianStatus"),
  ];

  const ids =
    acceptableIds && acceptableIds.length > 0
      ? acceptableIds
      : defaultAcceptableIds;

  return (
    <GcdsDetails detailsTitle={detailsTitle}>
      <ul aria-label={detailsTitle}>
        {ids.map((acceptableId) => (
          <li key={acceptableId}>{acceptableId}</li>
        ))}
      </ul>
    </GcdsDetails>
  );
}
