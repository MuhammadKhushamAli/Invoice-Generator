import { Button } from "../Button.jsx";
import { Trash2 } from "lucide-react";

export function CartItem({ item, onDelete }) {
  return (
    <div className="flex w-full items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all hover:bg-slate-50 hover:shadow-md">
      {/* Left Side: Image & Details */}
      <div className="flex items-center gap-4">
        {/* Image Container */}
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md border border-slate-100 bg-slate-50">
          <img
            src={item?.image}
            alt={`${item?.name} Picture`}
            className="h-full w-full object-cover"
          />
        </div>

        {/* Text Details */}
        <div className="flex flex-col">
          <h3 className="text-base font-semibold text-slate-900">
            {item?.name}
          </h3>
          <div className="mt-1 flex items-center gap-3 text-sm text-slate-500">
            <h5 className="font-medium text-slate-700">
              ${item?.price}{" / Item "}
              {/* Added $ for formatting, remove if handled in data */}
            </h5>
            <span className="h-1 w-1 rounded-full bg-slate-300"></span>{" "}
            {/* Dot separator */}
            <h6 className="text-slate-500">Qty: {item?.quantity}</h6>
          </div>
        </div>
      </div>

      {/* Right Side: Delete Action */}
      <div>
        <Button
          onClick={() => onDelete(item)}
          className="bg-white! p-2! text-red-500 shadow-none ring-1 ring-slate-200 hover:bg-red-50! hover:text-red-600 hover:ring-red-200"
        >
          <Trash2 className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
