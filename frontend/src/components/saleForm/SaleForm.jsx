import { useEffect, useState } from "react";
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

export function SaleForm({ onClick }) {
  const isLoggedIn = useSelector((state) => state?.auth?.loginStatus);
  const userData = useSelector((state) => state?.auth?.userData);
  const cart = useSelector((state) => state?.itemsCart?.cart);
  const navigate = useNavigate();

  const [alert, setAlert] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const { register, handleSubmit, reset } = useForm();
  const dispatch = useDispatch();

  useEffect(() => {
    setIsLoading(true);
    if (!(cart?.length && isLoggedIn)) navigate("/login");
    setIsLoading(false);
  }, []);

  const onSubmit = async (data) => {
    if (!(cart?.length && isLoggedIn)) navigate("/login");

    setAlert("");
    setIsLoading(true);
    try {
      data.itemsInfo = cart;
      const response = await axiosInstance.post("/api/v1/sales/add-sale", data);

      if (response?.status === 200) {
        reset();
        dispatch(clearCart());
        setAlert("Invoice Generated");
        let url = response?.data?.inv_url?.replace("http://", "https://");

        const downloadInvoice = () => {
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
        };
        downloadInvoice();
        onClick && onClick();
        if (
          window.location.pathname === "/sales" ||
          window.location.pathname === "/invoices"
        )
          window.location.reload();
      }
    } catch (error) {
      setAlert(error?.message);
    } finally {
      setIsLoading(false);
    }
  };

  return isLoading ? (
    <Loading />
  ) : (
    <div className="relative mx-auto w-full max-w-5xl rounded-xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/50 sm:p-6 md:p-8 lg:p-10">
      {/* Error Toast */}
      {alert && (
        <div className="mb-4 sm:mb-6">
          <Error message={alert} />
        </div>
      )}

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

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6 sm:space-y-8 md:space-y-10"
      >
        {/* ---------------- FORM HEADER ---------------- */}
        <div className="border-b border-slate-200 pb-4 sm:pb-6 pr-8 sm:pr-10 md:pr-12 pt-0">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            Sale Invoice Generation
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-500">
            Fill in the details below to generate a new commercial invoice.
          </p>
        </div>

        {/* ---------------- SECTION 1: INVOICE DETAILS ---------------- */}
        <div className="space-y-4 sm:space-y-6">
          <h3 className="flex items-center gap-2 text-base sm:text-lg font-semibold text-slate-800">
            <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />
            Invoice Related Information
          </h3>

          <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
            <Input
              type="text"
              label="HS Code"
              placeholder="e.g. 123456"
              Icon={FileText}
              {...register("hsCode", { required: true })}
            />
          </div>
        </div>

        {/* ---------------- SECTION 2: CUSTOMER DETAILS ---------------- */}
        <div className="space-y-4 sm:space-y-6">
          <h3 className="flex items-center gap-2 text-base sm:text-lg font-semibold text-slate-800">
            <User className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />
            Customer Related Information
          </h3>

          <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
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
              label="Customer Landmark"
              placeholder="Suite / Unit"
              Icon={MapPin}
              {...register("customerLandmark", { required: true })}
            />

            <Input
              type="text"
              label="Customer Street"
              placeholder="Street 1"
              Icon={MapPin}
              {...register("customerStreet", {
                required: true,
              })}
            />

            <Input
              type="text"
              label="Customer Area"
              placeholder="XYZ Area"
              Icon={MapPin}
              {...register("customerArea", { required: true })}
            />

            <Input
              type="text"
              label="Customer City"
              placeholder="XYZ City"
              Icon={Building}
              {...register("customerCity", { required: true })}
            />

            <Input
              type="text"
              label="Customer Country"
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
          </div>
        </div>

        {/* ---------------- SECTION 3: TAX & CHARGES ---------------- */}
        <div className="space-y-4 sm:space-y-6">
          <h3 className="flex items-center gap-2 text-base sm:text-lg font-semibold text-slate-800">
            <Percent className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />
            Taxes & Charges
          </h3>

          <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Sales Tax Rate */}
            <div className="relative">
              <Input
                type="number"
                label="Sales Tax Rate"
                placeholder="0"
                Icon={Percent}
                min={0}
                {...register("salesTaxRate", {
                  required: true,
                  validate: (value) => /^\d+$/.test(value) || "Must be Numbers",
                })}
              />
              <span className="pointer-events-none absolute right-3 top-9.5 flex h-5 items-center text-xs sm:text-sm font-medium text-slate-400">
                %
              </span>
            </div>

            {/* Special Excise Rate */}
            <div className="relative">
              <Input
                type="number"
                label="Special Excise Rate"
                placeholder="0"
                Icon={Percent}
                min={0}
                {...register("specialExciseRate", {
                  required: true,
                  validate: (value) => /^\d+$/.test(value) || "Must be Numbers",
                })}
              />
              <span className="pointer-events-none absolute right-3 top-9.5 flex h-5 items-center text-xs sm:text-sm font-medium text-slate-400">
                %
              </span>
            </div>

            {/* Further Sales Tax */}
            <div className="relative">
              <Input
                type="number"
                label="Discount:"
                placeholder="0"
                Icon={Scissors}
                min={0}
                {...register("discount", {
                  required: true,
                  validate: (value) => /^\d+$/.test(value) || "Must be Numbers",
                })}
              />
            </div>

            {/* Freight Charges */}
            <Input
              type="number"
              label="Freight / Other Charges"
              placeholder="0"
              min={0}
              Icon={Truck}
              {...register("freightOtherCharges", {
                required: true,
                validate: (value) => /^\d+$/.test(value) || "Must be Numbers",
              })}
            />
          </div>
        </div>

        {/* ---------------- FOOTER ACTION ---------------- */}
        <div className="mt-6 sm:mt-8 flex justify-end border-t border-slate-100 pt-4 sm:pt-6">
          <Button
            type="submit"
            className="w-full shadow-lg shadow-indigo-500/20 sm:w-auto sm:min-w-50"
            Icon={CheckCircle}
          >
            Generate Invoice
          </Button>
        </div>
      </form>
    </div>
  );
}
