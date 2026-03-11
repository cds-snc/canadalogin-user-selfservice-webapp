import { createContext } from "react";
import type { UserContextValue } from "../../types/user";

const UserContext = createContext<UserContextValue | null>(null);
export default UserContext;
