import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { homePath } from "../services/api.js";
import Loading from "../components/Loading.jsx";

export default function Register() {
  const { user, loading, register, error, setError } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "family" });
  const [busy, setBusy] = useState(false);

  if (loading) return <Loading />;
  if (user) return <Navigate to={homePath(user.role)} replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const nextUser = await register(form);
      navigate(homePath(nextUser.role));
    } catch {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="card mx-auto max-w-md">
      <h1 className="text-2xl font-semibold text-rebuild-navy">Register</h1>
      {error && <p className="mt-3 rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>}
      <label className="mt-4 block text-sm">
        Name
        <input
          required
          className="input"
          value={form.name}
          onChange={(e) => {
            setError("");
            setForm({ ...form, name: e.target.value });
          }}
        />
      </label>
      <label className="mt-3 block text-sm">
        Email
        <input
          type="email"
          required
          className="input"
          value={form.email}
          onChange={(e) => {
            setError("");
            setForm({ ...form, email: e.target.value });
          }}
        />
      </label>
      <label className="mt-3 block text-sm">
        Password
        <input
          type="password"
          required
          minLength={6}
          className="input"
          value={form.password}
          onChange={(e) => {
            setError("");
            setForm({ ...form, password: e.target.value });
          }}
        />
      </label>
      <label className="mt-3 block text-sm">
        Role
        <select
          className="input"
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
        >
          <option value="family">Affected family</option>
          <option value="volunteer">Volunteer</option>
        </select>
      </label>
      <button disabled={busy} className="btn-teal mt-5 w-full">
        {busy ? "Creating..." : "Create account"}
      </button>
      <p className="mt-3 text-center text-sm">
        Already registered?{" "}
        <Link className="text-rebuild-navy" to="/login">
          Login
        </Link>
      </p>
    </form>
  );
}
