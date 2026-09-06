import { useEffect, useState } from "react";
import api, { getErrorMessage } from "../services/api.js";
import Loading from "../components/Loading.jsx";
import PriorityBadge from "../components/PriorityBadge.jsx";

export default function VolunteerDashboard() {
  const [requests, setRequests] = useState([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const res = await api.get("/help-requests");
      setRequests(res.data || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setReady(true);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const claim = async (id) => {
    setError("");
    try {
      await api.patch(`/help-requests/${id}/claim`);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const updateStatus = async (id, status) => {
    setError("");
    try {
      await api.patch(`/help-requests/${id}/status`, { status });
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (!ready) return <Loading />;

  return (
    <section className="card">
      <h1 className="text-2xl font-semibold text-rebuild-navy">Volunteer dashboard</h1>
      {error && <p className="mt-3 rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>}
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-2">Family</th>
              <th>Type</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((item) => (
              <tr key={item._id} className="border-b align-top">
                <td className="py-3">
                  {item.familyId?.familyName || "Family"}
                  <div className="text-xs text-slate-500">{item.familyId?.recoveryId}</div>
                  <div className="text-xs">{item.description}</div>
                </td>
                <td className="capitalize">{item.type}</td>
                <td>
                  <PriorityBadge value={item.priority} />
                </td>
                <td className="capitalize">{String(item.status).replaceAll("_", " ")}</td>
                <td className="space-y-1">
                  {item.status === "pending" && (
                    <button onClick={() => claim(item._id)} className="btn-teal px-2 py-1">
                      Claim
                    </button>
                  )}
                  {item.status !== "pending" && item.status !== "resolved" && (
                    <div className="flex flex-wrap gap-1">
                      <button onClick={() => updateStatus(item._id, "in_progress")} className="btn-navy px-2 py-1">
                        In progress
                      </button>
                      <button
                        onClick={() => updateStatus(item._id, "resolved")}
                        className="rounded-lg bg-slate-700 px-2 py-1 text-sm text-white"
                      >
                        Resolve
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-slate-500">
                  No help requests yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
