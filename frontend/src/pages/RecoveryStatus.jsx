import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { getErrorMessage } from "../services/api.js";
import Loading from "../components/Loading.jsx";
import RecoveryIDCard from "../components/RecoveryIDCard.jsx";
import PriorityBadge from "../components/PriorityBadge.jsx";

const STEPS = ["registered", "help_requested", "sheltered", "in_recovery", "resolved"];

export default function RecoveryStatus() {
  const [family, setFamily] = useState(null);
  const [requests, setRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.get("/families/mine"), api.get("/help"), api.get("/notifications")])
      .then(([famRes, reqRes, noteRes]) => {
        setFamily(famRes.data.family);
        setRequests(reqRes.data.help || []);
        setNotifications(noteRes.data.notifications || []);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setReady(true));
  }, []);

  if (!ready) return <Loading />;

  if (!family) {
    return (
      <div className="card">
        <h1 className="text-2xl font-semibold text-rebuild-navy">Recovery status</h1>
        <p className="mt-2 text-sm text-slate-600">Register your family to receive a Recovery ID and status updates.</p>
        <Link to="/family" className="btn-navy mt-4 inline-block">
          Register family
        </Link>
      </div>
    );
  }

  const currentIndex = Math.max(STEPS.indexOf(family.status), 0);

  return (
    <div className="space-y-6">
      <RecoveryIDCard family={family} />
      {error && <p className="rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>}
      <section className="card">
        <h1 className="text-2xl font-semibold text-rebuild-navy">Recovery status</h1>
        <ol className="mt-5 grid gap-3 sm:grid-cols-5">
          {STEPS.map((step, index) => (
            <li
              key={step}
              className={`rounded-lg p-3 text-center text-xs font-medium capitalize ${
                index <= currentIndex ? "bg-rebuild-teal text-white" : "bg-slate-100 text-slate-500"
              }`}
            >
              {step.replaceAll("_", " ")}
            </li>
          ))}
        </ol>
        {family.shelterId && (
          <p className="mt-4 rounded bg-teal-50 p-3 text-sm">
            Allocated shelter: {family.shelterId.name} — {family.shelterId.location?.address}
          </p>
        )}
      </section>
      <section className="card">
        <h2 className="font-medium">Help requests</h2>
        <ul className="mt-3 space-y-3">
          {requests.map((item) => (
            <li key={item._id} className="flex items-start justify-between gap-3 rounded border p-3 text-sm">
              <div>
                <p className="font-medium capitalize">{item.category}</p>
                <p className="text-slate-600">{item.description}</p>
                <p className="mt-1 capitalize text-slate-500">{String(item.status).replaceAll("_", " ")}</p>
              </div>
              <PriorityBadge value={item.priority} />
            </li>
          ))}
          {requests.length === 0 && <li className="text-slate-500">No help requests yet.</li>}
        </ul>
      </section>
      <section className="card">
        <h2 className="font-medium">Updates</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {notifications.map((n) => (
            <li key={n._id}>{n.message}</li>
          ))}
          {notifications.length === 0 && <li className="text-slate-500">No updates yet.</li>}
        </ul>
      </section>
    </div>
  );
}
