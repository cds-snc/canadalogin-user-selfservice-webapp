import { Navigate, Outlet, useParams } from "react-router";

import { useIdvFeatureAccess } from "../../hooks/useIdvFeatureAccess";

export default function IdvFeatureRoute() {
  const hasIdvFeatureAccess = useIdvFeatureAccess();
  const { language = "en" } = useParams();

  if (!hasIdvFeatureAccess) {
    return <Navigate to={`/${language}`} replace />;
  }

  return <Outlet />;
}
