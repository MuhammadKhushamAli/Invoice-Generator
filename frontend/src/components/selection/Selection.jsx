import { Button } from "../Button.jsx";
import { DeliveryChalanForm } from "../deliveryChalanForm/DeliveryChalanForm.jsx";
import { QuotationForm } from "../quotationForm/QuotationForm.jsx";
import { SaleForm } from "../saleForm/SaleForm.jsx";
import { useState } from "react";
import { FileText, Truck, ClipboardList, X } from "lucide-react";

export function Selection({ onClick }) {
  const [isSaleForm, setIsSaleForm] = useState(false);
  const [isDeliveryForm, setIsDeliveryForm] = useState(false);
  const [isQuotationForm, setIsQuotationForm] = useState(false);

  if (isSaleForm) {
    return <SaleForm onClick={() => setIsSaleForm(false)} />;
  } else if (isDeliveryForm) {
    return <DeliveryChalanForm onClick={() => setIsDeliveryForm(false)} />;
  } else if (isQuotationForm) {
    return <QuotationForm onClick={() => setIsQuotationForm(false)} />;
  } else {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
        <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="text-center pt-10 pb-6">
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
              Create New Document
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Select a template to get started
            </p>
          </div>

          {/* Close Button */}
          {onClick && (
            <div className="absolute right-2 top-2 sm:right-4 sm:top-4 z-50 md:right-8 md:top-8">
              <Button
                onClick={onClick}
                Icon={X}
                className="flex items-center justify-center h-8 w-8 sm:h-10 sm:w-10 rounded-full! border border-slate-200! bg-white! p-0! text-slate-400! shadow-sm transition-colors hover:bg-slate-50! hover:text-slate-700! [&_svg]:mr-0! [&_svg]:h-4! [&_svg]:w-4! sm:[&_svg]:h-5! sm:[&_svg]:w-5!"
              />
            </div>
          )}

          {/* Document Selection Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-10 pb-12">
            <Button
              name="Sale Invoice"
              Icon={FileText}
              onClick={() => setIsSaleForm(true)}
              className="h-44! flex-col! gap-3! bg-white! border-2! border-slate-100! text-slate-700! hover:border-indigo-500! hover:bg-indigo-50/50! hover:text-indigo-700! hover:shadow-lg! transition-all duration-300 rounded-2xl group px-0! text-base! [&_svg]:h-8! [&_svg]:w-8! [&_svg]:mb-1! [&_svg]:mr-0!"
            />

            <Button
              name="Delivery Challan"
              Icon={Truck}
              onClick={() => setIsDeliveryForm(true)}
              className="h-44! flex-col! gap-3! bg-white! border-2! border-slate-100! text-slate-700! hover:border-indigo-500! hover:bg-indigo-50/50! hover:text-indigo-700! hover:shadow-lg! transition-all duration-300 rounded-2xl group px-0! text-base! [&_svg]:h-8! [&_svg]:w-8! [&_svg]:mb-1! [&_svg]:mr-0!"
            />

            <Button
              name="Quotation"
              Icon={ClipboardList}
              onClick={() => setIsQuotationForm(true)}
              className="h-44! flex-col! gap-3! bg-white! border-2! border-slate-100! text-slate-700! hover:border-indigo-500! hover:bg-indigo-50/50! hover:text-indigo-700! hover:shadow-lg! transition-all duration-300 rounded-2xl group px-0! text-base! [&_svg]:h-8! [&_svg]:w-8! [&_svg]:mb-1! [&_svg]:mr-0!"
            />
          </div>
        </div>
      </div>
    );
  }
}
