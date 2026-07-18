import { useEffect, useState } from "react";
import { AuthContext } from "./auth.context";
import { getCurrentUser } from "./services/auth.api";

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
                    // Handle both user and vendor responses from /me endpoint
                    setUser(response.user || response.vendor);
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
