import { createContext, useContext, useState } from "react";
import api from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    // ✅ FIX: Initialize state DIRECTLY from localStorage.
    // This prevents the "flash of null" that kicks you out on refresh.
    const [user, setUser] = useState(() => {
        try {
            const storedUser = localStorage.getItem("user");
            return storedUser ? JSON.parse(storedUser) : null;
        } catch (error) {
            return null;
        }
    });

    const [isAuth, setIsAuth] = useState(() => {
        return !!localStorage.getItem("access");
    });

    // We don't need a global "loading" for the initial check anymore
    // because we checked it synchronously above. 
    // You can keep this false or use it for login actions.
    const [loading, setLoading] = useState(false); 

    const login = (data) => {
        localStorage.setItem("access", data.access);
        localStorage.setItem("refresh", data.refresh);
        localStorage.setItem("user", JSON.stringify(data.user));
        setUser(data.user);
        setIsAuth(true);
    };

    const logout = () => {
        localStorage.clear();
        setUser(null);
        setIsAuth(false);
    };

    const refreshUser = async () => {
         try {
            const userRes = await api.get("user/me/");
            localStorage.setItem("user", JSON.stringify(userRes.data));
            setUser(userRes.data);
         } catch (e) {
            // If fetch fails (token expired), logout
            logout(); 
         }
    };

    return (
        <AuthContext.Provider value={{ user, isAuth, loading, login, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);