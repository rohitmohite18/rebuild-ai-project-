export default function Loading({ label = "Loading..." }) {
  return (
    <div className="flex items-center justify-center gap-3 p-8 text-sm text-slate-600">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-rebuild-navy border-t-transparent" />
      {label}
    </div>
  );
}
