import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { axiosInstance } from "../../axios/axios.js";
import { Loading } from "../Loading.jsx";
import { Input } from "../Input.jsx";
import { Button } from "../Button.jsx";
import { Error } from "../Error.jsx";
import Select from "react-select";
import { useCallback, useMemo, useState } from "react";
import {
  User,
  Building,
  MapPin,
  Globe,
  CheckCircle,
  Calendar,
  Truck,
  FileText,
  X,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { clearCart } from "../../features/itemCart/itemSlice.js";
import { useMutation } from "@tanstack/react-query";

export function DeliveryChalanForm({ onClick, quotationId = null }) {
  const userData = useSelector((state) => state?.auth?.userData);
  const isLoggedIn = useSelector((state) => state?.auth?.loginStatus);
  const cart = useSelector((state) => state?.itemsCart?.cart);
  const [alert, setAlert] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();
  const clientQuery = useQueryClient();
  const navigate = useNavigate();

  const customerFetch = useQuery({
    queryKey: ["customers", userData?._id],
    queryFn: async () => {
      const response = await axiosInstance.get(
        `/api/v1/customer/get-customers`,
      );
      return response.data;
    },
    refetchOnMount: true,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    enabled: isLoggedIn,
  });

  const { register, handleSubmit, setValue } = useForm();

  const downloadInvoice = useCallback(
    (url) => {
      if (!url) {
        setAlert("Invoice URL is not available for download.");
        return;
      }
      if (url?.includes("cloudinary")) {
        const decodedUrl = decodeURIComponent(url);
        let fileNameWithExt = decodedUrl.split("/").pop();
        fileNameWithExt = fileNameWithExt.replace(/\.[^/.]+$/, "");

        url = url?.replace(
          "/upload/",
          `/upload/fl_attachment:${userData?.businessName}-${fileNameWithExt}/`,
        );
        const a = document.createElement("a");

        a.href = url;

        a.click();
      } else {
        window.open(url, "_blank");
      }
    },
    [userData],
  );

  const addDeliveryChallanMutate = useMutation({
    mutationFn: async ({ data, quotationId }) => {
      const response = await axiosInstance.post(
        "/api/v1/deliveryChalan/add-delivery-chalan",
        data,
        {
          params: quotationId ? { quotationId } : {},
        },
      );
      return response.data;
    },
    onSuccess: (newData, {quotationId}) => {
      dispatch(clearCart());
      setAlert("Delivery Challan Generated");
      let url = newData?.inv_url?.replace("http://", "https://");
      downloadInvoice(url);
      onClick && onClick();
      clientQuery.invalidateQueries({
        queryKey: ["deliveryChallans", userData?._id],
      });

      if(quotationId)
      {
        clientQuery.invalidateQueries({
          queryKey: ["view-quotation", quotationId],
        });
      }

    },
    onError: (error) => {
      setAlert(error?.message);
    },
    onSettled: () => {
      clientQuery.invalidateQueries({
        queryKey: ["items", userData?._id],
      });
    },
  });

  const onSubmit = async (data) => {
    if (!isLoggedIn) navigate("/login");

    setAlert("");
    setIsLoading(true);
    try {
      if (!quotationId) {
        data.itemsInfo = cart;
      }
      await addDeliveryChallanMutate.mutateAsync({ data, quotationId });
    } catch (error) {
      setAlert(error?.message);
    } finally {
      setIsLoading(false);
    }
  };

  const onSelect = useCallback((value) => {
    setValue("customerName", value?.value?.customerName);
    setValue("customerLandmark", value?.value?.customerLandmark);
    setValue("customerStreet", value?.value?.customerStreet);
    setValue("customerArea", value?.value?.customerArea);
    setValue("customerCity", value?.value?.customerCity);
    setValue("customerCountry", value?.value?.customerCountry);
  }, []);

  const customers = useMemo(() => {
    const data = customerFetch?.data;
    if (data) {
      return data.map((customer) => {
        return {
          value: customer,
          label: customer?.customerName,
        };
      });
    }
    return [];
  }, [customerFetch?.data]);

  return isLoading || customerFetch?.isLoading ? (
    <Loading />
  ) : (
    <div className="relative mx-auto w-full max-w-5xl rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/60 transition-all duration-300">
      {/* Error Toast */}
      {(alert || customerFetch?.isError) && (
        <div className="mb-4 sm:mb-6 p-4 sm:p-6 pb-0">
          <Error message={alert || customerFetch?.error?.message} />
        </div>
      )}

      {/* Close Button - Refined positioning */}
      {onClick && (
        <div className="absolute right-4 top-4 z-50">
          <Button
            onClick={onClick}
            Icon={X}
            className="flex items-center justify-center h-10 w-10 rounded-full! border border-slate-100! bg-slate-50! p-0! text-slate-400! shadow-none transition-all hover:bg-red-50! hover:text-red-500! hover:border-red-100! [&_svg]:mr-0! [&_svg]:h-5! [&_svg]:w-5!"
          />
        </div>
      )}

      {/* Content Container */}
      <div className="p-6 sm:p-8 md:p-12">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
          {/* ---------------- FORM HEADER ---------------- */}
          <div className="relative border-b border-slate-100 pb-8">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-indigo-50 rounded-xl">
                <Truck className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                  Delivery Challan Generation
                </h1>
                <p className="text-sm text-slate-500 font-medium">
                  Create a professional delivery challan for your client
                </p>
              </div>
            </div>
            {/* Optional Search Integration styling */}
            {customers && (
              <div className="mt-6 max-w-md">
                <Select
                  options={customers}
                  className="ring-1 ring-slate-200 rounded-lg shadow-sm"
                  placeholder="Select Customers"
                  onChange={onSelect}
                />
              </div>
            )}
          </div>

          {/* ---------------- SECTION 1: CHALLAN DETAILS ---------------- */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 border-l-4 border-indigo-500 pl-4">
              <h3 className="text-lg font-bold text-slate-800">
                Challan Information
              </h3>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Input
                type="text"
                label="P.O Number"
                placeholder="Enter PO Number"
                Icon={FileText}
                {...register("poNo", { required: true })}
              />
            </div>
          </section>

          {/* ---------------- SECTION 2: CUSTOMER DETAILS ---------------- */}
          <section className="space-y-6 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-2 text-indigo-600">
              <User className="h-5 w-5" />
              <h3 className="text-lg font-bold text-slate-800">
                Delivery Recipient
              </h3>
            </div>

            <div className="grid gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Input
                type="text"
                label="Customer Name"
                placeholder="Company Name"
                Icon={User}
                {...register("customerName", { required: true })}
              />

              <Input
                type="text"
                label="Landmark"
                placeholder="Suite / Unit"
                Icon={MapPin}
                {...register("customerLandmark", { required: true })}
              />

              <Input
                type="text"
                label="Street Address"
                placeholder="Street 1"
                Icon={MapPin}
                {...register("customerStreet", { required: true })}
              />

              <Input
                type="text"
                label="Area"
                placeholder="XYZ Area"
                Icon={MapPin}
                {...register("customerArea", { required: true })}
              />

              <Input
                type="text"
                label="City"
                placeholder="XYZ City"
                Icon={Building}
                {...register("customerCity", { required: true })}
              />

              <Input
                type="text"
                label="Country"
                placeholder="XYZ Country"
                Icon={Globe}
                {...register("customerCountry", { required: true })}
              />
            </div>
          </section>

          {/* ---------------- SECTION 3: SHIPMENT DETAILS ---------------- */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 text-indigo-600">
              <Calendar className="h-5 w-5" />
              <h3 className="text-lg font-bold text-slate-800">
                Shipment Dates
              </h3>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 items-end">
              <Input
                type="date"
                label="P.O Date"
                Icon={Calendar}
                {...register("poDate", {
                  required: true,
                })}
              />
            </div>
          </section>

          {/* ---------------- FOOTER ACTION ---------------- */}
          <div className="mt-12 flex items-center justify-between border-t border-slate-100 pt-8">
            <p className="text-xs text-slate-400 max-w-50">
              Verify the delivery address and PO details before generating the
              challan.
            </p>
            <Button
              type="submit"
              className="w-full sm:w-auto px-8 py-6 text-base font-bold shadow-xl shadow-indigo-200 hover:shadow-indigo-300 transition-all rounded-xl"
              Icon={CheckCircle}
            >
              Generate Delivery Challan
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
