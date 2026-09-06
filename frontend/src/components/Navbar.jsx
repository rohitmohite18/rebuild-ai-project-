import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar({ onMenu }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="bg-rebuild-navy text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4">
        <div className="flex items-center gap-3">
          {user && (
            <button type="button" className="rounded p-1 md:hidden" onClick={onMenu} aria-label="Open menu">
              ☰
            </button>
          )}
          <Link to="/" className="text-lg font-semibold tracking-wide">
            REBUILD AI
          </Link>
        </div>
        <nav className="flex items-center gap-3 text-sm">
          {user ? (
            <>
              <span className="hidden text-white/80 sm:inline">{user.name}</span>
              <button type="button" onClick={onLogout} className="rounded bg-white/10 px-3 py-1">
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login">Login</NavLink>
              <NavLink to="/register" className="rounded bg-white/10 px-3 py-1">
                Register
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
