import { useContext } from "react";
import UserContext from "./UserContext";
import type { UserContextValue } from "../../types/user";

export function useUser(): UserContextValue {
  const context = useContext(UserContext);

  if (!context) throw new Error("useUser should be used within a Provider");

  return context;
}
