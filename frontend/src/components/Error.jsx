import { AlertCircle } from "lucide-react";

export function Error({ message }) {
  return (
    <div className="fixed left-1/2 top-0 z-50 flex w-full max-w-md -translate-x-1/2 items-center gap-3 rounded-b-lg border-x border-b border-red-200 bg-white px-6 py-4 shadow-lg shadow-red-500/10 animate-[slideDownUp_4s_ease-in-out_forwards]">
      {/* Error Icon */}
      <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />

      {/* Error Message Container */}
      <div className="flex-1 text-sm font-medium text-slate-800">{message}</div>
    </div>
  );
}
