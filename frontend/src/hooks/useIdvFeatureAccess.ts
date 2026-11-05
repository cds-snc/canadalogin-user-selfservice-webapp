import { useContext } from "react";

import UserContext from "../components/Providers/UserContext";
import config from "../config";
import { VITE_ENVIRONMENTS } from "../utils/constants";

export function useIdvFeatureAccess(): boolean {
  const context = useContext(UserContext);
  const environmentAllowsAccess =
    config.environment === VITE_ENVIRONMENTS.local ||
    config.environment === VITE_ENVIRONMENTS.dev;

  return environmentAllowsAccess || context?.state.features?.idv === true;
}
