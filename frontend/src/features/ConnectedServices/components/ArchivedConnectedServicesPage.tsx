import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import {
  GcdsButton,
  GcdsContainer,
  GcdsGrid,
  GcdsHeading,
  GcdsLink,
  GcdsText,
} from "@gcds-core/components-react";

import AccessibleNotice from "../../../components/InfoBlocks/AccessibleNotice";
import ConnectedServicesTable from "./ConnectedServicesTable";
import {
  DEV_ONLY_FEATURE,
  EXTERNAL_NAVIGATION_LINKS,
} from "../../../utils/constants";
import "./ConnectedServicesPage.css";

export default function ArchivedConnectedServicesPage() {
  const { language = "en" } = useParams<{ language: string }>();
  const { t } = useTranslation("connectedServices");

  if (!DEV_ONLY_FEATURE) {
    return null;
  }

  return (
    <GcdsContainer role="main">
      <GcdsGrid columns="1" gap="450">
        <AccessibleNotice
          noticeRole="success"
          noticeTitleTag="h2"
          noticeTitle={t("successNotice.title")}
        >
          <GcdsText>{t("successNotice.body")}</GcdsText>
        </AccessibleNotice>

        <GcdsGrid columns="1" gap="150">
          <GcdsHeading tag="h1">{t("heading")}</GcdsHeading>
          <GcdsText>{t("description")}</GcdsText>
        </GcdsGrid>

        <GcdsGrid columns="1" gap="150">
          <GcdsHeading tag="h2">{t("servicesHeading")}</GcdsHeading>
          <GcdsText>{t("servicesDescription")}</GcdsText>
          <ConnectedServicesTable />
        </GcdsGrid>

        <GcdsGrid
          columns="1"
          columnsDesktop="max-content max-content"
          gap="200"
        >
          <GcdsButton type="button" buttonRole="danger">
            {t("signOutEverywhere")}
          </GcdsButton>
          <GcdsButton type="button" buttonRole="secondary">
            {t("doThisLater")}
          </GcdsButton>
        </GcdsGrid>

        <section
          className="connected-services-information"
          aria-label={t("informationHeading")}
        >
          <GcdsGrid columns="1" gap="200">
            <GcdsText>
              <strong>{t("informationHeading")}</strong>
            </GcdsText>
            <GcdsText>{t("informationBody")}</GcdsText>
            <GcdsText>
              {t("directoryPrefix")}{" "}
              <GcdsLink
                href={EXTERNAL_NAVIGATION_LINKS.gcAccountDirectory}
                lang={language}
                style={{ textDecoration: "underline" }}
              >
                {t("directoryLink")}
              </GcdsLink>
            </GcdsText>
          </GcdsGrid>
        </section>
      </GcdsGrid>
    </GcdsContainer>
  );
}
