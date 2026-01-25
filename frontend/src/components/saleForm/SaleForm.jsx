import { useCallback, useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { Loading } from "../Loading.jsx";
import { Input } from "../Input.jsx";
import { Button } from "../Button.jsx";
import { axiosInstance } from "../../axios/axios.js";
import { Error } from "../Error.jsx";
import {
  FileText,
  User,
  Building,
  MapPin,
  Globe,
  CreditCard,
  Percent,
  Truck,
  CheckCircle,
  X,
  Scissors,
} from "lucide-react";
import { clearCart } from "../../features/itemCart/itemSlice.js";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import Select from "react-select";

export function SaleForm({ onClick, deliveryChallanId = null }) {
  const clientQuery = useQueryClient();
  const isLoggedIn = useSelector((state) => state?.auth?.loginStatus);
  const userData = useSelector((state) => state?.auth?.userData);
  const cart = useSelector((state) => state?.itemsCart?.cart);
  const navigate = useNavigate();

  const [alert, setAlert] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, setValue } = useForm();
  const dispatch = useDispatch();

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

  const addInvoiceMutate = useMutation({
    mutationFn: async ({ data, deliveryChallanId }) => {
      const response = await axiosInstance.post(
        "/api/v1/sales/add-sale",
        data,
        {
          params: deliveryChallanId ? { deliveryChallanId } : {},
        },
      );
      return response.data;
    },
    onSuccess: (newData, { deliveryChallanId }) => {
      dispatch(clearCart());
      setAlert("Invoice Generated");
      let url = newData?.inv_url?.replace("http://", "https://");
      downloadInvoice(url);
      clientQuery.invalidateQueries({
        queryKey: ["invoices", userData?._id],
        refetchType: "active",
      });
      clientQuery.invalidateQueries({
        queryKey: ["sales", userData?._id],
        refetchType: "active",
      });

      if (deliveryChallanId) {
        clientQuery.invalidateQueries({
          queryKey: ["view-deliveryChallan", deliveryChallanId],
          refetchType: "active",
        });
      }
      onClick && onClick();
    },
    onError: (error) => {
      setAlert(error?.message);
    },
    onSettled: ({ deliveryChallanId }) => {
      if (!deliveryChallanId) {
        clientQuery.invalidateQueries({
          queryKey: ["items", userData?._id],
          refetchType: "active",
        });
      }
    },
  });

  useEffect(() => {
    if (!isLoggedIn) navigate("/login");
  }, []);

  const onSubmit = async (data) => {
    if (!isLoggedIn) navigate("/login");

    setAlert("");
    setIsLoading(true);
    try {
      if (!deliveryChallanId) {
        data.itemsInfo = cart;
      }
      await addInvoiceMutate.mutateAsync({ data, deliveryChallanId });
    } catch (error) {
      setAlert(error?.message);
    } finally {
      setIsLoading(false);
    }
  };

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

  const onSelect = useCallback((value) => {
    setValue("customerName", value?.value?.customerName);
    setValue("customerLandmark", value?.value?.customerLandmark);
    setValue("customerStreet", value?.value?.customerStreet);
    setValue("customerArea", value?.value?.customerArea);
    setValue("customerCity", value?.value?.customerCity);
    setValue("customerCountry", value?.value?.customerCountry);
    setValue("customerGST", value?.value?.customerGST);
    setValue("customerNTN", value?.value?.customerNTN);
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
      {/* Error Toast - Reverted to original inline layout */}
      {(alert || customerFetch?.isError) && (
        <div className="mb-4 sm:mb-6 p-4 sm:p-6 pb-0 fixed">
          <Error message={alert || customerFetch?.error?.message} />
        </div>
      )}

      {/* Close Button */}
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
                <FileText className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                  Sale Invoice Generation
                </h1>
                <p className="text-sm text-slate-500 font-medium">
                  Fill in the details below to generate a new commercial
                  invoice.
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

          {/* ---------------- SECTION 1: INVOICE DETAILS ---------------- */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 border-l-4 border-indigo-500 pl-4">
              <h3 className="text-lg font-bold text-slate-800">
                Invoice Information
              </h3>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Input
                type="text"
                label="HS Code"
                placeholder="e.g. 123456"
                Icon={FileText}
                {...register("hsCode", { required: true })}
              />
            </div>
          </section>

          {/* ---------------- SECTION 2: CUSTOMER DETAILS ---------------- */}
          <section className="space-y-6 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-2 text-indigo-600">
              <User className="h-5 w-5" />
              <h3 className="text-lg font-bold text-slate-800">
                Customer Details
              </h3>
            </div>

            <div className="grid gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Input
                type="text"
                label="Attn. To"
                placeholder="XYZ Department"
                Icon={Building}
                {...register("AttnTo", { required: true })}
              />

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

              <Input
                type="text"
                label="Customer GST"
                placeholder="1234567"
                Icon={CreditCard}
                {...register("customerGST", { required: true })}
              />

              <Input
                type="text"
                label="Customer NTN"
                placeholder="1234567"
                Icon={CreditCard}
                {...register("customerNTN", { required: true })}
              />

              <Input
                type="text"
                label="Customer PO"
                placeholder="1234567"
                Icon={CreditCard}
                {...register("po", { required: true })}
              />
            </div>
          </section>

          {/* ---------------- SECTION 3: TAX & CHARGES ---------------- */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 text-indigo-600">
              <Percent className="h-5 w-5" />
              <h3 className="text-lg font-bold text-slate-800">
                Taxes & Charges
              </h3>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 items-end">
              <div className="relative">
                <Input
                  type="number"
                  label="Sales Tax Rate"
                  placeholder="0"
                  Icon={Percent}
                  min={0}
                  {...register("salesTaxRate", {
                    required: true,
                    validate: (value) =>
                      /^\d+$/.test(value) || "Must be Numbers",
                  })}
                />
                <span className="absolute right-4 bottom-2.75 text-sm font-bold text-slate-400">
                  %
                </span>
              </div>

              <div className="relative">
                <Input
                  type="number"
                  label="Special Excise Rate"
                  placeholder="0"
                  Icon={Percent}
                  min={0}
                  {...register("specialExciseRate", {
                    required: true,
                    validate: (value) =>
                      /^\d+$/.test(value) || "Must be Numbers",
                  })}
                />
                <span className="absolute right-4 bottom-2.75 text-sm font-bold text-slate-400">
                  %
                </span>
              </div>

              <Input
                type="number"
                label="Discount"
                placeholder="0"
                Icon={Scissors}
                min={0}
                {...register("discount", {
                  required: true,
                  validate: (value) => /^\d+$/.test(value) || "Must be Numbers",
                })}
              />

              <Input
                type="number"
                label="Freight Charges"
                placeholder="0"
                min={0}
                Icon={Truck}
                {...register("freightOtherCharges", {
                  required: true,
                  validate: (value) => /^\d+$/.test(value) || "Must be Numbers",
                })}
              />
            </div>
          </section>

          {/* ---------------- FOOTER ACTION ---------------- */}
          <div className="mt-12 flex items-center justify-between border-t border-slate-100 pt-8">
            <p className="hidden sm:block text-xs text-slate-400 max-w-50">
              Please review the customer tax IDs and HS codes before generating
              the official invoice.
            </p>
            <Button
              type="submit"
              className="w-full sm:w-auto px-10 py-6 text-base font-bold shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all rounded-xl"
              Icon={CheckCircle}
            >
              Generate Invoice
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
