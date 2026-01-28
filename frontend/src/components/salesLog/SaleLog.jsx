import { Link } from "react-router";
import { Package, Calendar, Banknote, ExternalLink } from "lucide-react";

export function SaleLog({ sale }) {
  return (
    <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:border-indigo-300 hover:shadow-md">
      {/* Top Section: Price & Item Count */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Total Amount
          </p>
          <div className="mt-1 flex flex-row items-center text-xl font-bold text-slate-900">
            <Banknote className="mr-2 h-5 w-5 text-indigo-600 translate-y-px" />
            {sale?.price}
          </div>
        </div>

        {/* Badge for Item Count */}
        <div className="flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
          <Package className="h-3.5 w-3.5" />
          {sale?.items} Items
        </div>
      </div>

      {/* Bottom Section: Date & Action Link */}
      <div className="mt-5 flex items-end justify-between border-t border-slate-100 pt-4">
        {/* Date */}
        <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
          <Calendar className="h-3.5 w-3.5" />
          {new Date(sale?.createdAt).toString().split(" GMT")[0]}
        </div>

        {/* View Invoice Link */}
        <Link
          to={`/invoice/${sale?.invoice?._id}`}
          className="group flex items-center gap-1 text-sm font-semibold text-indigo-600 transition-colors hover:text-indigo-800"
        >
          View Invoice
          <ExternalLink className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}
