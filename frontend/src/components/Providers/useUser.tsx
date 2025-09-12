import { useContext } from "react";
import UserContext from "./UserContext";
import type { UserState } from "./UserProvider"; // or from your types file

export function useUser(): { state: UserState; dispatch: React.Dispatch<any> } {
  const context = useContext(UserContext);

  if (!context) throw new Error("useUser should be used within a Provider");

  return context;
}
