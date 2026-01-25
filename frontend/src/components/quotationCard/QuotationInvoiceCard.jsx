import { useEffect } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router";
import { ClipboardList, Calendar } from "lucide-react";

export function QuotationInvoiceCard({ quotationInvoice }) {
  const navigate = useNavigate();
  const isLoggedIn = useSelector((state) => state?.auth?.loginStatus);

  useEffect(() => {
    if (!isLoggedIn) navigate("/login");
  });
  return (
    <Link to={`/quotation/${quotationInvoice?._id}`}>
      <div className="group flex cursor-pointer flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-md hover:shadow-indigo-500/10">
        {/* Header Section: Icon & Name */}
        <div className="flex items-start gap-4">
          {/* Icon Box - Matches Delivery Card Tone */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
            <ClipboardList className="h-5 w-5" />
          </div>

          {/* Quotation Name */}
          <div className="flex flex-col">
            <h3 className="text-base font-semibold text-slate-900 line-clamp-2">
              {quotationInvoice?.name}
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 mt-0.5">
              Quotation
            </span>
          </div>
        </div>

        {/* Footer Section: Date */}
        <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3 text-xs font-medium text-slate-500">
          <Calendar className="h-3.5 w-3.5" />
          <p>
            Created At:{" "}
            {new Date(quotationInvoice?.createdAt).toString().split("GMT")[0]}
          </p>
        </div>
      </div>
    </Link>
  );
}
