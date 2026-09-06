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
        api.get("/admin/dashboard"),
        api.get("/families"),
        api.get("/shelters"),
        api.get("/help"),
      ]);
      setSummary(sumRes.data.dashboard);
      setFamilies(famRes.data.families || []);
      setShelters(shelRes.data.shelters || []);
      setRequests(reqRes.data.help || []);
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
      await api.put(`/families/${id}`, { status });
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

  const locatedFamily = families.find(
    (family) => Number.isFinite(family.location?.lat) && Number.isFinite(family.location?.lng)
  );
  const lat = locatedFamily?.location.lat ?? 19.076;
  const lng = locatedFamily?.location.lng ?? 72.8777;
  const delta = 0.08;
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - delta}%2C${lat - delta}%2C${lng + delta}%2C${lat + delta}&layer=mapnik&marker=${lat}%2C${lng}`;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-rebuild-navy">Admin dashboard</h1>
      {error && <p className="rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>}
      {summary && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Families", summary.families],
            ["Open requests", summary.helpRequests?.open],
            ["Shelters", summary.shelters?.count],
            ["Users", summary.users],
          ].map(([label, value]) => (
            <div key={label} className="card p-4">
              <p className="text-sm text-slate-500">{label}</p>
              <p className="text-2xl font-semibold">{value}</p>
            </div>
          ))}
        </div>
      )}
      <section className="card overflow-hidden p-0">
        <div className="p-5 pb-3">
          <h2 className="font-medium">Family location map</h2>
          <p className="mt-1 text-sm text-slate-500">
            {locatedFamily ? `Showing ${locatedFamily.familyName || "registered family"}.` : "Showing the default service area until a family location is added."}
          </p>
        </div>
        <iframe title="Family location map" src={mapUrl} className="h-80 w-full border-0" loading="lazy" />
      </section>
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
                    <option value="displaced">displaced</option>
                    <option value="sheltered">sheltered</option>
                    <option value="reunited">reunited</option>
                  </select>
                </td>
                <td>
                  {family.shelter ? (
                    family.shelter.name
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
                  {item.family?.familyName || "Family"}
                  <div className="text-xs text-slate-500">{item.family?.recoveryId}</div>
                </td>
                <td className="capitalize">{item.category}</td>
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
