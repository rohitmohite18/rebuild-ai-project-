import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api, { getErrorMessage } from "../services/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("rebuild_token");
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get("/auth/me")
      .then((res) => setUser(res.data.user))
      .catch(() => {
        localStorage.removeItem("rebuild_token");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      setError,
      login: async (email, password) => {
        setError("");
        try {
          const res = await api.post("/auth/login", { email, password });
          localStorage.setItem("rebuild_token", res.data.token);
          setUser(res.data.user);
          return res.data.user;
        } catch (err) {
          const message = getErrorMessage(err);
          setError(message);
          throw new Error(message);
        }
      },
      register: async (payload) => {
        setError("");
        try {
          const res = await api.post("/auth/register", payload);
          localStorage.setItem("rebuild_token", res.data.token);
          setUser(res.data.user);
          return res.data.user;
        } catch (err) {
          const message = getErrorMessage(err);
          setError(message);
          throw new Error(message);
        }
      },
      logout: () => {
        localStorage.removeItem("rebuild_token");
        setUser(null);
      },
    }),
    [user, loading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
