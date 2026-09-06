import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { getErrorMessage } from "../services/api.js";
import Loading from "../components/Loading.jsx";
import PriorityBadge from "../components/PriorityBadge.jsx";
import RecoveryIDCard from "../components/RecoveryIDCard.jsx";

const NEED_OPTIONS = ["food", "water", "medical", "shelter"];

export default function FamilyDashboard() {
  const [family, setFamily] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    familyName: "",
    address: "",
    lat: "",
    lng: "",
    houseCondition: "damaged",
    basicNeeds: ["food", "water"],
    membersText: "",
  });

  const load = async () => {
    try {
      const [famRes, noteRes] = await Promise.all([api.get("/families/mine"), api.get("/notifications")]);
      setFamily(famRes.data.family);
      setNotifications(noteRes.data.notifications || []);
      if (famRes.data.family?.members) {
        setForm((prev) => ({
          ...prev,
          membersText: famRes.data.family.members.map((m) => `${m.name},${m.age},${m.status}`).join("\n"),
          address: famRes.data.family.location?.address || "",
          lat: famRes.data.family.location?.lat ?? "",
          lng: famRes.data.family.location?.lng ?? "",
        }));
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setReady(true);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const parseMembers = () =>
    form.membersText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [name, age, status] = line.split(",").map((p) => p.trim());
        return { name, age: Number(age || 0), status: status || "safe" };
      });

  const registerFamily = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await api.post("/families", {
        familyName: form.familyName,
        location: {
          address: form.address,
          lat: Number(form.lat),
          lng: Number(form.lng),
        },
        houseCondition: form.houseCondition,
        basicNeeds: form.basicNeeds,
        members: parseMembers(),
      });
      setFamily(res.data.family);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const saveMembers = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await api.patch("/families/mine/members", { members: parseMembers() });
      setFamily(res.data.family);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const saveLocation = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await api.put(`/families/${family._id}`, {
        location: {
          address: form.address,
          lat: Number(form.lat),
          lng: Number(form.lng),
        },
      });
      setFamily(res.data.family);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const useCurrentLocation = () => {
    setError("");
    if (!navigator.geolocation) {
      setError("Location services are not supported by this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setForm((prev) => ({
          ...prev,
          lat: coords.latitude.toFixed(6),
          lng: coords.longitude.toFixed(6),
        }));
      },
      (positionError) => {
        const messages = {
          1: "Location permission was denied. Allow it for this site and try again.",
          2: "Your device could not determine a location. Turn on system Location Services or enter the address and coordinates manually.",
          3: "Finding your location timed out. Check your internet connection and try again.",
        };
        setError(messages[positionError.code] || "We could not access your location. Enter it manually instead.");
      },
      { enableHighAccuracy: false, timeout: 20000, maximumAge: 300000 }
    );
  };

  const toggleNeed = (need) => {
    setForm((prev) => ({
      ...prev,
      basicNeeds: prev.basicNeeds.includes(need)
        ? prev.basicNeeds.filter((n) => n !== need)
        : [...prev.basicNeeds, need],
    }));
  };

  if (!ready) return <Loading />;

  if (!family) {
    return (
      <form onSubmit={registerFamily} className="card">
        <h1 className="text-2xl font-semibold text-rebuild-navy">Family registration</h1>
        <p className="mt-1 text-sm text-slate-600">A Recovery ID is created after you submit.</p>
        {error && <p className="mt-3 rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>}
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="text-sm">
            Family name
            <input
              required
              className="input"
              value={form.familyName}
              onChange={(e) => setForm({ ...form, familyName: e.target.value })}
            />
          </label>
          <label className="text-sm">
            House condition
            <select
              className="input"
              value={form.houseCondition}
              onChange={(e) => setForm({ ...form, houseCondition: e.target.value })}
            >
              <option value="intact">Intact</option>
              <option value="damaged">Damaged</option>
              <option value="destroyed">Destroyed</option>
            </select>
          </label>
          <label className="text-sm md:col-span-2">
            Address
            <input
              required
              className="input"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </label>
          <label className="text-sm">
            Latitude
            <input
              required
              className="input"
              value={form.lat}
              onChange={(e) => setForm({ ...form, lat: e.target.value })}
            />
          </label>
          <label className="text-sm">
            Longitude
            <input
              required
              className="input"
              value={form.lng}
              onChange={(e) => setForm({ ...form, lng: e.target.value })}
            />
          </label>
          <div className="md:col-span-2">
            <button type="button" onClick={useCurrentLocation} className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-50">
              Use my current location
            </button>
          </div>
        </div>
        <p className="mt-4 text-sm font-medium">Basic needs</p>
        <div className="mt-2 flex flex-wrap gap-3">
          {NEED_OPTIONS.map((need) => (
            <label key={need} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.basicNeeds.includes(need)} onChange={() => toggleNeed(need)} />
              {need}
            </label>
          ))}
        </div>
        <label className="mt-4 block text-sm">
          Members (one per line: name,age,status)
          <textarea
            className="input h-28"
            placeholder="Asha,34,safe"
            value={form.membersText}
            onChange={(e) => setForm({ ...form, membersText: e.target.value })}
          />
        </label>
        <button disabled={busy} className="btn-navy mt-4">
          {busy ? "Saving..." : "Generate Recovery ID"}
        </button>
      </form>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <section className="space-y-4 lg:col-span-2">
        <RecoveryIDCard family={family} />
        <div className="card">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h1 className="text-2xl font-semibold text-rebuild-navy">{family.familyName}</h1>
            <PriorityBadge value={family.priority} />
          </div>
          <p className="mt-2 text-sm text-slate-600">
            House: {family.houseCondition} · Score: {family.priorityScore} · Needs:{" "}
            {(family.basicNeeds || []).join(", ") || "none"}
          </p>
          {family.shelterId && (
            <p className="mt-2 rounded bg-teal-50 p-2 text-sm">
              Shelter: {family.shelterId.name} — {family.shelterId.location?.address}
            </p>
          )}
          {error && <p className="mt-3 rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>}
          <h2 className="mt-5 font-medium">Family members</h2>
          <textarea
            className="input h-28"
            value={form.membersText}
            onChange={(e) => setForm({ ...form, membersText: e.target.value })}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={saveMembers} disabled={busy} className="btn-teal">
              Update members
            </button>
            <Link to="/family/help" className="btn-navy inline-block">
              Request help
            </Link>
            <Link to="/family/status" className="rounded-lg border px-4 py-2 text-sm">
              Recovery status
            </Link>
          </div>
          <div className="mt-6 border-t pt-5">
            <h2 className="font-medium">Map location</h2>
            <p className="mt-1 text-sm text-slate-600">Save your coordinates to place this family on the admin map.</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <input
                className="input sm:col-span-3"
                placeholder="Address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
              <input
                required
                className="input"
                placeholder="Latitude, e.g. 19.0760"
                value={form.lat}
                onChange={(e) => setForm({ ...form, lat: e.target.value })}
              />
              <input
                required
                className="input"
                placeholder="Longitude, e.g. 72.8777"
                value={form.lng}
                onChange={(e) => setForm({ ...form, lng: e.target.value })}
              />
              <button type="button" onClick={useCurrentLocation} className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-50">
                Use my current location
              </button>
              <button type="button" onClick={saveLocation} disabled={busy || !form.lat || !form.lng} className="btn-navy">
                Save location
              </button>
            </div>
          </div>
        </div>
      </section>
      <aside className="card">
        <h2 className="font-medium">Notifications</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {notifications.length === 0 && <li className="text-slate-500">No updates yet.</li>}
          {notifications.map((n) => (
            <li key={n._id} className={n.read ? "text-slate-500" : ""}>
              {n.message}
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
