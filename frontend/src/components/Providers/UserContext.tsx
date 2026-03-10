import { createContext } from "react";
import type { UserContextValue } from "./UserProvider";

const UserContext = createContext<UserContextValue | null>(null);
export default UserContext;
