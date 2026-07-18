import { useEffect, useState } from "react";
import { AuthContext } from "./auth.context";
import { getCurrentUser } from "./services/auth.api";
import { getCompanyInfo } from "../profile/services/profile.api";

const AuthContextProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(true);
    const [companyInfo, setCompanyInfo] = useState({ cname: "Your Logo", comp_prof_image: null });
    const [showProductFilters, setShowProductFilters] = useState(false);

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

    const refreshCompanyInfo = async () => {
        try {
            const info = await getCompanyInfo();
            if (info) {
                setCompanyInfo(info);
            }
        } catch (err) {
            console.error("Failed to load company logo info in context:", err);
        }
    };

    useEffect(() => {
        if (!user) return;
        refreshCompanyInfo();
    }, [user]);

    return (
        <AuthContext.Provider value={{ user, setUser, loading, setLoading, checkingAuth, companyInfo, setCompanyInfo, refreshCompanyInfo, showProductFilters, setShowProductFilters }}>
            {children}
        </AuthContext.Provider>
    )
}

export default AuthContextProvider;
