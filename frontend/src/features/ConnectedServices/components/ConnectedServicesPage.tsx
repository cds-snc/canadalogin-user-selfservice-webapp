import { useEffect, useState } from "react";
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
import {
  connectedServicesApi,
  type ConnectedService,
} from "../api/connectedServicesApi";

import {
  DEV_ONLY_FEATURE,
  EXTERNAL_NAVIGATION_LINKS,
} from "../../../utils/constants";
import "./ConnectedServicesPage.css";

export default function ConnectedServicesPage() {
  const { language = "en" } = useParams<{ language: string }>();
  const { t } = useTranslation("connectedServices");
  const [services, setServices] = useState<ConnectedService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!DEV_ONLY_FEATURE) {
      return;
    }

    const loadServices = async () => {
      try {
        setServices(await connectedServicesApi.getConnectedServices());
      } catch {
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    void loadServices();
  }, []);

  if (!DEV_ONLY_FEATURE) {
    return null;
  }

  const formatTimestamp = (timestamp?: string | null) =>
    timestamp
      ? new Intl.DateTimeFormat(language, {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(timestamp))
      : t("notAvailable");

  const localizedStatus = (status: ConnectedService["sessionStatus"]) =>
    t(`sessions.${status}`, { defaultValue: status });

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
          {isLoading && <GcdsText>{t("loading")}</GcdsText>}
          {!isLoading && hasError && <GcdsText>{t("error")}</GcdsText>}
          {!isLoading && !hasError && services.length === 0 && (
            <GcdsText>{t("empty")}</GcdsText>
          )}
          {!isLoading && !hasError && services.length > 0 && (
            <div className="connected-services-table-wrapper">
              <table className="connected-services-table">
                <thead>
                  <tr>
                    <th scope="col">{t("columns.application")}</th>
                    <th scope="col">{t("columns.lastLogin")}</th>
                    <th scope="col">{t("columns.status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((service) => (
                    <tr key={service.clientId}>
                      <th scope="row">
                        {service.applicationName ?? service.name}
                      </th>
                      <td>{formatTimestamp(service.lastLogin)}</td>
                      <td>{localizedStatus(service.sessionStatus)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
