import { useNavigate } from "react-router";

import type { NavigateHelper, NavigateState } from "../types/hooks";

export function useNavigateHelper(): NavigateHelper {
  const navigate = useNavigate();

  return (
    path: string,
    replaceHistory: boolean = false,
    state?: NavigateState,
  ) => navigate(path, { replace: replaceHistory, state });
}
