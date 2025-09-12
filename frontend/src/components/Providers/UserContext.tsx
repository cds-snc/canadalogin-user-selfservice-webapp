import { createContext } from "react";
import type { UserState } from "./UserProvider";

interface UserContextType {
  state: UserState;
  dispatch: React.Dispatch<any>;
}

const UserContext = createContext<UserContextType | null>(null);
export default UserContext;
