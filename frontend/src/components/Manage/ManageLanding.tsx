import { useEffect } from "react";
import { generatePath } from "react-router";
import { useNavigate, useParams } from "react-router";

import { ROUTE_PATTERNS, SESSION_STORAGE_KEYS } from "../../utils/constants";
import ManageDashboard from "./ManageDashboard";

export default function ManageLanding() {
  const { language } = useParams();
  const navigate = useNavigate();

  const shouldRedirectToSecuritySettings =
    sessionStorage.getItem(
      SESSION_STORAGE_KEYS.passwordChangeRedirectToSecurity,
    ) === "true";

  useEffect(() => {
    if (!shouldRedirectToSecuritySettings) {
      return;
    }

    sessionStorage.removeItem(
      SESSION_STORAGE_KEYS.passwordChangeRedirectToSecurity,
    );
    navigate(
      generatePath(ROUTE_PATTERNS.securitySettings, {
        language: language ?? "en",
      }),
      { replace: true },
    );
  }, [language, navigate, shouldRedirectToSecuritySettings]);

  if (shouldRedirectToSecuritySettings) {
    return null;
  }

  return <ManageDashboard />;
}
