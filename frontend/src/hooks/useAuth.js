// src/hooks/useAuth.js
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { loginApi, validateTokenApi, logoutApi } from "../api/authApi";
import { fetchUserProfileApi } from "../api/userApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [role, setRole] = useState(() => localStorage.getItem("role"));
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [loading, setLoading] = useState(true);

  // 🛠️ Helper: normalize profile to always include displayName
  const normalizeUser = (profile, role) => {
    if (!profile) return null;

    let displayName = "";
    switch (role) {
      case "admin":
        displayName = profile.adminName || profile.name;
        break;
      case "teacher":
        displayName = profile.teacherName || profile.name;
        break;
      case "student":
        displayName = profile.studentName || profile.name;
        break;
      case "parent":
        displayName = profile.parentName || profile.name;
        break;
      default:
        displayName = profile.name || "User";
    }

    return { ...profile, displayName };
  };

  // 🔑 Login
  const login = useCallback(async (role, userId, password) => {
    try {
      const { token, role: userRole } = await loginApi(role, userId, password);

      localStorage.setItem("token", token);
      localStorage.setItem("role", userRole);
      setToken(token);
      setRole(userRole);

      const profile = await fetchUserProfileApi(userRole);
      const normalized = normalizeUser(profile, userRole);

      localStorage.setItem("user", JSON.stringify(normalized));
      setUser(normalized);

      return normalized;
    } catch (err) {
      console.error("❌ Login failed:", err);
      throw err;
    }
  }, []);

  // 🚪 Logout
  const logout = useCallback(async () => {
    try {
      if (role) await logoutApi(role);
    } catch (err) {
      console.warn("⚠️ Logout API failed, continuing cleanup...");
    }
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    setToken(null);
    setRole(null);
    setUser(null);
  }, [role]);

  // 🔍 Validate token on app load
  useEffect(() => {
    const initAuth = async () => {
      if (!token || !role) {
        setLoading(false);
        return;
      }

      try {
        await validateTokenApi(role);
        const profile = await fetchUserProfileApi(role);
        const normalized = normalizeUser(profile, role);

        setUser(normalized);
        localStorage.setItem("user", JSON.stringify(normalized));
      } catch (err) {
        console.error("❌ Token invalid:", err);
        logout();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [token, role, logout]);

  return (
    <AuthContext.Provider value={{ token, role, user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
