import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const LINKS = {
  survivor: [
    { to: "/family", label: "Dashboard" },
    { to: "/family/help", label: "Help request" },
    { to: "/family/status", label: "Recovery status" },
  ],
  volunteer: [{ to: "/volunteer", label: "Help desk" }],
  admin: [{ to: "/admin", label: "Dashboard" }],
};

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth();
  if (!user) return null;

  const links = LINKS[user.role] || [];

  return (
    <>
      {open && <button type="button" className="fixed inset-0 z-20 bg-black/40 md:hidden" onClick={onClose} />}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-56 bg-white p-4 shadow-md transition-transform md:static md:z-0 md:translate-x-0 md:shadow-none ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <p className="mb-4 text-xs uppercase tracking-wide text-slate-500">{user.role}</p>
        <nav className="flex flex-col gap-1 text-sm">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/family" || link.to === "/admin"}
              onClick={onClose}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 ${isActive ? "bg-rebuild-navy text-white" : "hover:bg-slate-100"}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
