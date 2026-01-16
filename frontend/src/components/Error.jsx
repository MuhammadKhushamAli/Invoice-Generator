import { AlertCircle } from "lucide-react";

export function Error({ message }) {
  return (
    <div className="fixed left-1/2 top-16 sm:top-0 z-50 flex w-[90%] sm:w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center gap-2 sm:gap-3 rounded-b-lg border-x border-b border-red-200 bg-white px-3 py-2.5 sm:px-6 sm:py-4 shadow-lg shadow-red-500/10 animate-[slideDownUp_4s_ease-in-out_forwards]">
      {/* Error Icon */}
      <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-red-600" />

      {/* Error Message Container */}
      <div className="flex-1 text-xs sm:text-sm font-medium text-slate-800 wrap-break-word">{message}</div>
    </div>
  );
}
