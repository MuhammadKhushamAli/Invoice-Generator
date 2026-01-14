import { Loader2 } from "lucide-react";

export function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm transition-opacity">
      <div className="flex flex-col items-center justify-center rounded-lg bg-white p-6 shadow-xl ring-1 ring-slate-900/5">
        {/* Loading Icon */}
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />

        {/* Optional Text */}
        <span className="mt-4 text-sm font-medium text-slate-600">
          Please wait...
        </span>
      </div>
    </div>
  );
}
