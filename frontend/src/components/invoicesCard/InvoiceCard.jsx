import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router";
import { FileText, Calendar, Trash2 } from "lucide-react";
import { axiosInstance } from "../../axios/axios.js";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "../Button.jsx";
import { Error } from "../Error.jsx";
import { Loading } from "../Loading.jsx";

export function InvoiceCard({ invoice }) {
  const navigate = useNavigate();
  const [alert, setAlert] = useState("");
  const isLoggedIn = useSelector((state) => state?.auth?.loginStatus);
  const userData = useSelector((state) => state?.auth?.userData);
  const clientQuery = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) navigate("/login");
  });

  const onDeleteHandler = useMutation({
    mutationFn: async (id) => {
      const response = await axiosInstance.delete(
        `/api/v1/invoice/delete-invoice/${id}`,
      );
      return response.data;
    },
    onSuccess: () => {
      clientQuery.invalidateQueries({
        queryKey: ["invoices", userData?._id],
        refetchType: "active",
      });
    },
  });

  const onDelClickHandler = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await onDeleteHandler.mutateAsync(invoice?._id);
      setIsLoading(false);
      setAlert("Invoice Deleted Successfully");
    } catch (error) {
      setAlert("Error in Deleting Invoice");
    }
  };
  return (
    <>
      {isLoading && <Loading />}
      <Link to={`/invoice/${invoice?._id}`}>
        {alert && (
          <div className="absolute inset-x-0 top-0 z-50 bg-red-50 px-4 py-2 text-center text-xs font-medium text-red-600">
            <Error message={alert} />
          </div>
        )}
        <div className="group flex cursor-pointer flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-md hover:shadow-indigo-500/10 relative">
          {/* Trash Icon */}
          {!invoice?.cancelled && (
            <div>
              <Button
                onClick={onDelClickHandler}
                className="h-9 w-9 rounded-full! bg-white/90! p-0! text-slate-500! shadow-sm backdrop-blur hover:bg-indigo-50! hover:text-indigo-600! flex items-center justify-center! [&_svg]:mr-0! absolute right-0 top-0 mt-1.5 mr-1.5"
                Icon={Trash2}
              />
            </div>
          )}
          {/* Header Section: Icon & Name */}
          <div className="flex items-start gap-4">
            {/* Icon Box */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
              <FileText className="h-5 w-5" />
            </div>

            {/* Invoice Name */}
            <div className="flex flex-col">
              <h3
                className={`text-base font-semibold text-slate-900 line-clamp-2 ${invoice.cancelled && "line-through"}`}
              >
                {invoice?.name}
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 mt-0.5">
                Sale Tax Invoice
              </span>
            </div>
          </div>

          {/* Footer Section: Date */}
          <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3 text-xs font-medium text-slate-500">
            <Calendar className="h-3.5 w-3.5" />
            <p>
              Created At:{" "}
              {new Date(invoice?.createdAt).toString().split("GMT")[0]}
            </p>
          </div>
        </div>
      </Link>
    </>
  );
}
