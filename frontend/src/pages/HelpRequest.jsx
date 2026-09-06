import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { getErrorMessage } from "../services/api.js";
import Loading from "../components/Loading.jsx";
import PriorityBadge from "../components/PriorityBadge.jsx";

export default function HelpRequest() {
  const [requests, setRequests] = useState([]);
  const [family, setFamily] = useState(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ type: "food", description: "" });

  const load = async () => {
    try {
      const [reqRes, famRes] = await Promise.all([api.get("/help-requests/mine"), api.get("/families/mine")]);
      setRequests(reqRes.data || []);
      setFamily(famRes.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setReady(true);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.post("/help-requests", form);
      setForm({ ...form, description: "" });
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (!ready) return <Loading />;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <form onSubmit={onSubmit} className="card">
        <h1 className="text-2xl font-semibold text-rebuild-navy">Help request</h1>
        {!family && (
          <p className="mt-2 text-sm text-amber-700">
            Register your family first. <Link className="underline" to="/family">Go to dashboard</Link>
          </p>
        )}
        {error && <p className="mt-3 rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>}
        <label className="mt-4 block text-sm">
          Type
          <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="medical">Medical</option>
            <option value="food">Food</option>
            <option value="water">Water</option>
            <option value="shelter">Shelter</option>
            <option value="rescue">Rescue</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label className="mt-3 block text-sm">
          Description
          <textarea
            required
            className="input h-28"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </label>
        <button disabled={busy || !family} className="btn-navy mt-4">
          {busy ? "Sending..." : "Submit request"}
        </button>
      </form>
      <section className="card">
        <h2 className="font-medium">Your requests</h2>
        <ul className="mt-3 space-y-3">
          {requests.map((item) => (
            <li key={item._id} className="rounded border p-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <strong className="capitalize">{item.type}</strong>
                <PriorityBadge value={item.priority} />
              </div>
              <p className="mt-1">{item.description}</p>
              <p className="mt-1 capitalize text-slate-500">Status: {String(item.status).replaceAll("_", " ")}</p>
            </li>
          ))}
          {requests.length === 0 && <li className="text-slate-500">No requests yet.</li>}
        </ul>
      </section>
    </div>
  );
}
