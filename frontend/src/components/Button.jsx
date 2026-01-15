// Props Must have Icon

export function Button({
  name,
  onClick,
  type = "button",
  className,
  ...props
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {/* Logic to render Lucide Icon if 'Icon' is passed in props */}
      {props.Icon && <props.Icon className="mr-2 h-4 w-4" />}
      {name}
    </button>
  );
}
