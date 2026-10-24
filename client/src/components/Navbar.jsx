import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import OnlineCount from "./OnlineCount.jsx";
import CoffeeModal from "./CoffeeModal.jsx";

const APP_NAME = import.meta.env.VITE_APP_NAME || "Nearby";

export function Navbar() {
  const [coffee, setCoffee] = useState(false);
  return (
    <header className="topbar">
      <Link to="/" className="brand">{APP_NAME}</Link>
      <OnlineCount />
      <button className="coffee" onClick={() => setCoffee(true)}>☕ Buy me a coffee</button>
      {coffee && <CoffeeModal onClose={() => setCoffee(false)} />}
    </header>
  );
}

export function TabBar() {
  const { user, logout } = useAuth();
  if (!user?.onboarded) return user ? (
    <nav className="tabs"><button onClick={logout}>Log out</button></nav>
  ) : null;
  return (
    <nav className="tabs">
      <NavLink to="/" end>Discover</NavLink>
      <NavLink to="/matches">Matches</NavLink>
      <NavLink to="/profile">Profile</NavLink>
      <button onClick={logout}>Log out</button>
    </nav>
  );
}
