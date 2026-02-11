import React from "react";
import { createContext } from "react";
import type { UserState, Action } from "./UserProvider";

interface UserContextType {
  state: UserState;
  dispatch: React.Dispatch<Action>;
}

const UserContext = createContext<UserContextType | null>(null);
export default UserContext;
