import PriorityBadge from "./PriorityBadge.jsx";

export default function RecoveryIDCard({ family }) {
  if (!family) return null;

  return (
    <div className="rounded-2xl bg-rebuild-navy p-5 text-white shadow-sm">
      <p className="text-xs uppercase tracking-wide text-white/70">Recovery ID</p>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
        <p className="text-2xl font-semibold">{family.recoveryId}</p>
        <PriorityBadge value={family.priority} />
      </div>
      <p className="mt-3 text-sm">{family.familyName}</p>
      <p className="mt-1 text-sm text-white/80 capitalize">{String(family.status || "").replaceAll("_", " ")}</p>
      {family.location?.address && <p className="mt-1 text-xs text-white/70">{family.location.address}</p>}
    </div>
  );
}
