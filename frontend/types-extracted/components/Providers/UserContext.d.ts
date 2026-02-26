import type { UserState } from "./UserProvider";
interface UserContextType {
    state: UserState;
    dispatch: React.Dispatch<any>;
}
declare const UserContext: import("react").Context<UserContextType>;
export default UserContext;
