import { useTranslation } from "react-i18next";
import {
  GcdsContainer,
  GcdsGrid,
  GcdsHeading,
  GcdsText,
} from "@gcds-core/components-react";

import { DEV_ONLY_FEATURE } from "../../../utils/constants";
import ConnectedServicesTable from "./ConnectedServicesTable";

export default function ConnectedServicesPage() {
  const { t } = useTranslation("connectedServices");

  if (!DEV_ONLY_FEATURE) {
    return null;
  }

  return (
    <GcdsContainer role="main">
      <GcdsGrid columns="1" gap="150">
        <GcdsHeading tag="h1">{t("pageTitle")}</GcdsHeading>
        <GcdsText>{t("pageDescription")}</GcdsText>
        <ConnectedServicesTable />
      </GcdsGrid>
    </GcdsContainer>
  );
}
