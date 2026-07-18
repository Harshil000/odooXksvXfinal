import { createContext , useEffect, useState } from "react";
import { getCurrentUser } from "./services/auth.api";

export const AuthContext = createContext();

const AuthContextProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(true);

    useEffect(() => {
        let active = true;

        async function loadSession() {
            try {
                const response = await getCurrentUser();
                if (active) {
                    setUser(response.user);
                }
            } catch {
                if (active) {
                    setUser(null);
                }
            } finally {
                if (active) {
                    setCheckingAuth(false);
                }
            }
        }

        loadSession();

        return () => {
            active = false;
        };
    }, []);

    return (
        <AuthContext.Provider value={{ user, setUser, loading, setLoading, checkingAuth }}>
            {children}
        </AuthContext.Provider>
    )
}

export default AuthContextProvider;