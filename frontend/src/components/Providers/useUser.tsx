import React from "react";
import { useContext } from "react";
import UserContext from "./UserContext";
import { UserState } from "./UserProvider"; // or from your types file

export function useUser(): { state: UserState; dispatch: React.Dispatch<any> } {
  const context = useContext(UserContext);

  if (!context) throw new Error("useUser should be used within a Provider");

  return context;
}
