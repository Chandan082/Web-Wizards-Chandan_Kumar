import { createContext, useContext, useEffect, useMemo, useState } from "react";

const AuthContext = createContext(null);

const STORAGE_KEY = "librarySeatAuth";

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const saved = safeParse(localStorage.getItem(STORAGE_KEY));
    if (saved?.token) setToken(saved.token);
    if (saved?.user) setUser(saved.user);
  }, []);

  useEffect(() => {
    if (!token) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user }));
  }, [token, user]);

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthed: Boolean(token),
      isAdmin: user?.role === "admin",
      setAuth: ({ token: newToken, user: newUser }) => {
        setToken(newToken);
        setUser(newUser);
      },
      logout: () => {
        setToken(null);
        setUser(null);
      },
      updateUser: (patch) => setUser((u) => (u ? { ...u, ...patch } : u)),
    }),
    [token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

