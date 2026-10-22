import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { GcdsLink, GcdsText } from "@gcds-core/components-react";

import {
  connectedServicesApi,
  type ConnectedService,
} from "../api/connectedServicesApi";
import "./ConnectedServicesTable.css";

function safeServiceUrl(value?: string | null): string | undefined {
  if (!value) {
    return undefined;
  }
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.href
      : undefined;
  } catch {
    // Missing or invalid destinations remain plain text, not broken links.
  }
  return undefined;
}

export default function ConnectedServicesTable() {
  const { language = "en" } = useParams<{ language: string }>();
  const { t } = useTranslation("connectedServices");
  const [services, setServices] = useState<ConnectedService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadServices = async () => {
      try {
        const result = await connectedServicesApi.getConnectedServices();
        if (!cancelled) {
          setServices(result);
        }
      } catch {
        if (!cancelled) {
          setHasError(true);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadServices();
    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) {
    return <GcdsText>{t("loading")}</GcdsText>;
  }
  if (hasError) {
    return <GcdsText>{t("error")}</GcdsText>;
  }
  if (services.length === 0) {
    return <GcdsText>{t("empty")}</GcdsText>;
  }

  const formatTimestamp = (timestamp?: string | null) => {
    if (!timestamp) {
      return t("notAvailable");
    }

    const isFrench = language === "fr";
    const parts = new Intl.DateTimeFormat(language, {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hourCycle: isFrench ? "h23" : "h12",
    }).formatToParts(new Date(timestamp));
    const isWholeHour = parts.some(
      (part) => part.type === "minute" && part.value === "00",
    );

    // Canada.ca uses "4:30 pm" / "9 am" and "16 h 30" / "9 h".
    return parts
      .map((part, index) => {
        if (isFrench && part.type === "hour") {
          return String(Number(part.value));
        }
        if (isWholeHour && part.type === "minute") {
          return "";
        }
        if (part.type === "literal" && parts[index + 1]?.type === "minute") {
          if (isFrench) {
            return isWholeHour ? " h" : " h ";
          }
          return isWholeHour ? "" : ":";
        }
        if (part.type === "dayPeriod") {
          return part.value.toLowerCase();
        }
        return part.value.replace(/[\u00a0\u202f]/g, " ");
      })
      .join("");
  };

  return (
    <div className="connected-services-table-wrapper">
      <table className="connected-services-table">
        <thead>
          <tr>
            <th scope="col">{t("columns.application")}</th>
            <th scope="col">{t("columns.lastLogin")}</th>
          </tr>
        </thead>
        <tbody>
          {services.map((service) => {
            const href =
              safeServiceUrl(service.localizedUrls?.[language]) ??
              safeServiceUrl(service.url);

            return (
              <tr key={service.clientId}>
                <th scope="row">
                  {href ? (
                    <GcdsLink href={href} lang={language} external>
                      {service.name}
                    </GcdsLink>
                  ) : (
                    service.name
                  )}
                </th>
                <td>{formatTimestamp(service.lastLogin)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
