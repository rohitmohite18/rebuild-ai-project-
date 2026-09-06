const PRIORITY_CLASS = {
  CRITICAL: "bg-red-100 text-red-800",
  HIGH: "bg-orange-100 text-orange-800",
  MEDIUM: "bg-yellow-100 text-yellow-800",
  LOW: "bg-green-100 text-green-800",
};

export default function PriorityBadge({ value }) {
  if (!value) return null;
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${PRIORITY_CLASS[value] || "bg-slate-100"}`}>
      {value}
    </span>
  );
}
