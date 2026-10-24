import { Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./auth.jsx";
import { Navbar, TabBar } from "./components/Navbar.jsx";
import Login from "./pages/Login.jsx";
import Profile from "./pages/Profile.jsx";
import Discover from "./pages/Discover.jsx";
import Matches from "./pages/Matches.jsx";
import Chat from "./pages/Chat.jsx";

function Protected() {
  const { user, loading } = useAuth();
  const { pathname } = useLocation();
  if (loading) return <p className="center muted">Loading…</p>;
  if (!user) return <Navigate to="/login" replace />;
  // New users must finish their profile (photo, date of birth, location) first
  if (!user.onboarded && pathname !== "/profile") return <Navigate to="/profile" replace />;
  return <Outlet />;
}

export default function App() {
  return (
    <>
      <Navbar />
      <main className="page">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<Protected />}>
            <Route path="/" element={<Discover />} />
            <Route path="/matches" element={<Matches />} />
            <Route path="/chat/:id" element={<Chat />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <TabBar />
    </>
  );
}
