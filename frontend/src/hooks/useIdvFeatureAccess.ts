import { useContext } from "react";

import UserContext from "../components/Providers/UserContext";

export function useIdvFeatureAccess(): boolean {
  const context = useContext(UserContext);
  return context?.state.features?.idv === true;
}
