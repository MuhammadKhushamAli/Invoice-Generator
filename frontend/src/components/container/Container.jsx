export function Container({ children, className }) {
  return (
    <div
      className={`mx-auto w-full max-w-4xl rounded-xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/50 md:p-8 ${className}`}
    >
      {children}
    </div>
  );
}
