import { useEffect, useState } from "react";
import api, { getErrorMessage } from "../services/api.js";
import Loading from "../components/Loading.jsx";
import PriorityBadge from "../components/PriorityBadge.jsx";

export default function AdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [families, setFamilies] = useState([]);
  const [shelters, setShelters] = useState([]);
  const [requests, setRequests] = useState([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const [sumRes, famRes, shelRes, reqRes] = await Promise.all([
        api.get("/admin/summary"),
        api.get("/families"),
        api.get("/shelters"),
        api.get("/help-requests"),
      ]);
      setSummary(sumRes.data);
      setFamilies(famRes.data || []);
      setShelters(shelRes.data || []);
      setRequests(reqRes.data || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setReady(true);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const setStatus = async (id, status) => {
    try {
      await api.patch(`/families/${id}/status`, { status });
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const allocate = async (familyId, shelterId) => {
    try {
      await api.post(`/families/${familyId}/allocate-shelter`, { shelterId });
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (!ready) return <Loading />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-rebuild-navy">Admin dashboard</h1>
      {error && <p className="rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>}
      {summary && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Families", summary.families],
            ["Open requests", summary.openRequests],
            ["Shelters", summary.shelters],
            ["Volunteers", summary.volunteers],
          ].map(([label, value]) => (
            <div key={label} className="card p-4">
              <p className="text-sm text-slate-500">{label}</p>
              <p className="text-2xl font-semibold">{value}</p>
            </div>
          ))}
        </div>
      )}
      <section className="card overflow-x-auto">
        <h2 className="font-medium">Families</h2>
        <table className="mt-3 min-w-full text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-2">Family</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Shelter</th>
            </tr>
          </thead>
          <tbody>
            {families.map((family) => (
              <tr key={family._id} className="border-b align-top">
                <td className="py-3">
                  {family.familyName}
                  <div className="text-xs text-slate-500">{family.recoveryId}</div>
                </td>
                <td>
                  <PriorityBadge value={family.priority} />
                  <div className="text-xs">{family.priorityScore}</div>
                </td>
                <td>
                  <select
                    className="rounded border px-2 py-1"
                    value={family.status}
                    onChange={(e) => setStatus(family._id, e.target.value)}
                  >
                    <option value="registered">registered</option>
                    <option value="help_requested">help_requested</option>
                    <option value="sheltered">sheltered</option>
                    <option value="in_recovery">in_recovery</option>
                    <option value="resolved">resolved</option>
                  </select>
                </td>
                <td>
                  {family.shelterId ? (
                    family.shelterId.name
                  ) : (
                    <select
                      defaultValue=""
                      className="rounded border px-2 py-1"
                      onChange={(e) => e.target.value && allocate(family._id, e.target.value)}
                    >
                      <option value="">Allocate...</option>
                      {shelters.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.name} ({s.occupied}/{s.capacity})
                        </option>
                      ))}
                    </select>
                  )}
                </td>
              </tr>
            ))}
            {families.length === 0 && (
              <tr>
                <td colSpan={4} className="py-6 text-slate-500">
                  No families yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
      <section className="card overflow-x-auto">
        <h2 className="font-medium">Help requests</h2>
        <table className="mt-3 min-w-full text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-2">Family</th>
              <th>Type</th>
              <th>Priority</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((item) => (
              <tr key={item._id} className="border-b">
                <td className="py-3">
                  {item.familyId?.familyName || "Family"}
                  <div className="text-xs text-slate-500">{item.familyId?.recoveryId}</div>
                </td>
                <td className="capitalize">{item.type}</td>
                <td>
                  <PriorityBadge value={item.priority} />
                </td>
                <td className="capitalize">{String(item.status).replaceAll("_", " ")}</td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr>
                <td colSpan={4} className="py-6 text-slate-500">
                  No help requests yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
