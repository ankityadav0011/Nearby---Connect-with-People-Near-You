import { createContext, useContext, useEffect, useState } from "react";
import { api } from "./api.js";
import { socket } from "./socket.js";

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (localStorage.getItem("token")) {
        try { setUser((await api("/users/me")).user); }
        catch { localStorage.removeItem("token"); }
      }
      setLoading(false);
    })();
  }, []);

  // (Re)connect the socket once we know who is logged in
  useEffect(() => {
    if (loading) return;
    socket.disconnect();
    socket.connect();
  }, [user?.id, loading]);

  const login = (token, u) => { localStorage.setItem("token", token); setUser(u); };
  const logout = () => { localStorage.removeItem("token"); setUser(null); };
  const refresh = async () => { const u = (await api("/users/me")).user; setUser(u); return u; };

  return <Ctx.Provider value={{ user, loading, login, logout, refresh }}>{children}</Ctx.Provider>;
}
