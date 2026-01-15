import { useId } from "react";
import { forwardRef } from "react";

// Props Must Have Icon

export const Input = forwardRef(
  ({ type = "text", label, className, Icon, ...props }, ref) => {
    const id = useId();
    return (
      <div className="w-full">
        <label
          htmlFor={id}
          className="mb-1.5 block text-sm font-medium text-slate-700"
        >
          {label}
        </label>
        <div className="relative">
          {/* Logic to render Lucide Icon if 'Icon' is passed in props */}
          {Icon && (
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Icon size={18} />
            </div>
          )}
          <input
            type={type}
            id={id}
            ref={ref}
            className={`block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-50 ${
              Icon ? "pl-10" : ""
            } ${className}`}
            {...props}
          />
        </div>
      </div>
    );
  }
);
