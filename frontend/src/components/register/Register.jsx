import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router";
import { Input } from "../Input.jsx";
import {
  Building2,
  User,
  Mail,
  Phone,
  Hash,
  Lock,
  MapPin,
  Home,
  Landmark,
  Globe,
  Save,
} from "lucide-react";
import { Error } from "../Error.jsx";
import { Button } from "../Button.jsx";
import { login } from "../../features/authentication/authSlice.js";
import { axiosInstance } from "../../axios/axios.js";
import { InvoiceCredentials } from "../invoiceCredentials/InvoiceCredentials.jsx";

export function Register() {
  const [alert, setAlert] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoForCredential, setIsGoForCredential] = useState(false);
  const { register, handleSubmit, watch, setValue } = useForm();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const slugTransformation = useCallback((value) => {
    if (value && typeof value === "string") {
      return value
        .trim()
        .toLowerCase()
        .replace(/[^a-zA-Z\d]+/g, "-");
    }
    return "";
  }, []);

  useEffect(() => {
    const input = watch((value, { name }) => {
      if (name == "businessName") {
        setValue("userName", slugTransformation(value.businessName), {
          shouldValidate: true,
        });
      }
    });
    return () => input.unsubscribe();
  }, [slugTransformation, watch, setValue]);

  const submitForm = useCallback(
    async (data) => {
      setIsLoading(true);
      setAlert("");
      try {
        const response = await axiosInstance.post(
          "/api/v1/user/register-user",
          data,
        );
        console.log(response);
        if (response.status === 200) {
          const logInResponse = await axiosInstance.patch(
            "/api/v1/user/login",
            {
              email: data.email,
              password: data.password,
            },
          );
          if (logInResponse.status === 200) {
            dispatch(login({ userData: logInResponse.data.newUser }));
            setIsGoForCredential(true);
          } else {
            setAlert(logInResponse.response.message);
          }
        } else {
          setALert(logInResponse.message);
        }
      } catch (error) {
        setAlert(error.message);
      } finally {
        setIsLoading(false);
      }
    },
    [dispatch, navigate],
  );

  return (
    <div className="w-full">
      {/* Error Toast */}
      {alert && <Error message={alert} />}

      {isGoForCredential ? (
        <InvoiceCredentials />
      ) : (
        <form onSubmit={handleSubmit(submitForm)} className="space-y-8">
          {/* Page Header */}
          <div className="border-b border-slate-200 pb-4">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Business Registration
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Create your business profile to start generating invoices.
            </p>
          </div>

          {/* GRID LAYOUT */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* ================= BUSINESS DETAILS SECTION ================= */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-6 shadow-sm">
              <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold text-slate-800">
                <Building2 className="h-5 w-5 text-indigo-600" />
                Business Details
              </h2>

              <div className="space-y-5">
                <Input
                  type="text"
                  label="Business Name"
                  placeholder="XYZ Enterprise"
                  disabled={isLoading}
                  Icon={User}
                  {...register("businessName", { required: true })}
                />

                <Input
                  type="text"
                  label="Business Slogan"
                  placeholder="We deal in..."
                  disabled={isLoading}
                  {...register("slogan", { required: true })}
                />

                <Input
                  type="text"
                  label="Username"
                  disabled
                  Icon={User}
                  className="bg-slate-100 text-slate-500"
                  {...register("userName", { required: true })}
                />

                <Input
                  type="email"
                  label="Email Address"
                  placeholder="xyz@gmail.com"
                  disabled={isLoading}
                  Icon={Mail}
                  {...register("email", { required: true })}
                />

                {/* --- Website Field (Styled & Fixed) --- */}
                <Input
                  type="text"
                  label="Website (optional)"
                  placeholder="xyz.com"
                  disabled={isLoading}
                  Icon={Globe}
                  {...register("website")}
                />

                <Input
                  type="tel"
                  label="Phone Number"
                  placeholder="0312-3456789"
                  disabled={isLoading}
                  Icon={Phone}
                  {...register("phone_no", { required: true })}
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="text"
                    label="GST No."
                    placeholder="12345678"
                    disabled={isLoading}
                    Icon={Hash}
                    {...register("gst_no", { required: true })}
                  />

                  <Input
                    type="text"
                    label="NTN No."
                    placeholder="12345678"
                    disabled={isLoading}
                    Icon={Hash}
                    {...register("ntn_no", { required: true })}
                  />
                </div>

                <Input
                  type="password"
                  label="Password"
                  placeholder="••••••••"
                  disabled={isLoading}
                  Icon={Lock}
                  {...register("password", { required: true })}
                />
              </div>
            </div>

            {/* ================= ADDRESS DETAILS SECTION ================= */}
            <div className="flex flex-col rounded-xl border border-slate-200 bg-slate-50/50 p-6 shadow-sm">
              <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold text-slate-800">
                <MapPin className="h-5 w-5 text-indigo-600" />
                Address Information
              </h2>

              <div className="space-y-5">
                <Input
                  type="text"
                  label="Landmark / Suite"
                  placeholder="123-A"
                  disabled={isLoading}
                  Icon={Home}
                  {...register("landmark", { required: true })}
                />

                <Input
                  type="text"
                  label="Street Address"
                  placeholder="Street 1"
                  disabled={isLoading}
                  Icon={MapPin}
                  {...register("street", {
                    required: true,
                  })}
                />

                <Input
                  type="text"
                  label="Area / Town"
                  placeholder="XYZ-Town"
                  disabled={isLoading}
                  Icon={Landmark}
                  {...register("area", { required: true })}
                />

                <Input
                  type="text"
                  label="City"
                  placeholder="XYZ-City"
                  Icon={Globe}
                  disabled={isLoading}
                  {...register("city", { required: true })}
                />

                <Input
                  type="text"
                  label="Country"
                  placeholder="XYZ-Country"
                  disabled={isLoading}
                  Icon={Globe}
                  {...register("country", { required: true })}
                />
              </div>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="flex items-center justify-end border-t border-slate-100 pt-6">
            <Button
              type="submit"
              Icon={Save}
              disabled={isLoading}
              className="min-w-37.5"
            >
              Register Business
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
