import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router";
import { Input } from "../Input.js";
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
import { Error } from "../Error.js";
import { Button } from "../Button.js";
import { login } from "../../features/authentication/authSlice.js";
import { axiosInstance } from "../../axios/axios.js";

export function Register() {
  const [alert, setAlert] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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
        setValue("userName", slugTransformation(value.fullName), {
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
          data
        );
        if (response.status === 200) {
          const logInResponse = await axiosInstance.patch(
            "/api/v1/user/login",
            {
              email: data.email,
              password: data.password,
            }
          );
          if (logInResponse.status === 200) {
            dispatch(login({ userData: logInResponse.data.user }));
            navigate("/");
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
    [dispatch, navigate]
  );

  return (
    <div className="max-w-6xl mx-auto p-6">
      {alert && <Error message={alert} />}

      <form onSubmit={handleSubmit(submitForm)} className="space-y-8">
        <h1 className="text-2xl font-semibold text-gray-800">
          Business Registration
        </h1>

        {/* GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* ================= BUSINESS DETAILS ================= */}
          <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
            <h2 className="text-lg font-medium flex items-center gap-2 text-gray-700">
              <Building2 size={20} /> Business Details
            </h2>

            <Input
              type="text"
              label="Business's Name:"
              placeholder="XYZ Enterprise"
              disabled={isLoading}
              Icon={User}
              {...register("businessName", { required: true })}
            />

            <Input
              type="text"
              label="Business's Slogan:"
              placeholder="We deal in..."
              disabled={isLoading}
              {...register("slogan", { required: true })}
            />

            <Input
              type="text"
              label="User Name:"
              disabled
              Icon={User}
              {...register("userName", { required: true })}
            />

            <Input
              type="email"
              label="Email:"
              placeholder="xyz@gmail.com"
              disabled={isLoading}
              Icon={Mail}
              {...register("email", { required: true })}
            />

            <Input
              type="tel"
              label="Phone Number:"
              placeholder="0312-3456789"
              disabled={isLoading}
              Icon={Phone}
              {...register("phone_no", { required: true })}
            />

            <Input
              type="text"
              label="GST No.:"
              placeholder="12345678"
              disabled={isLoading}
              Icon={Hash}
              {...register("gst_no", { required: true })}
            />

            <Input
              type="text"
              label="NTN No.:"
              placeholder="12345678"
              disabled={isLoading}
              Icon={Hash}
              {...register("ntn_no", { required: true })}
            />

            <Input
              type="password"
              label="Password:"
              disabled={isLoading}
              Icon={Lock}
              {...register("password", { required: true })}
            />
          </div>

          {/* ================= ADDRESS DETAILS ================= */}
          <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
            <h2 className="text-lg font-medium flex items-center gap-2 text-gray-700">
              <MapPin size={20} /> Address Information
            </h2>

            <Input
              type="text"
              label="Landmark:"
              placeholder="123-A"
              disabled={isLoading}
              Icon={Home}
              {...register("landmark", { required: true })}
            />

            <Input
              type="text"
              label="Street:"
              placeholder="Street 1"
              disabled={isLoading}
              Icon={Landmark}
              {...register("street", {
                required: true,
                validate: (value) =>
                  value.startsWith("Street") || "Must have Prefix 'Street'",
                onChange: (e) => {
                  const PREFIX = "Street";
                  let value = e.target.value;

                  if (!value.startsWith(PREFIX)) {
                    value = PREFIX + value.replace(/street/i, "");
                    setValue("street", value);
                  }
                },
              })}
            />

            <Input
              type="text"
              label="Area:"
              placeholder="XYZ-Town"
              disabled={isLoading}
              Icon={Landmark}
              {...register("area", { required: true })}
            />

            <Input
              type="text"
              label="City:"
              placeholder="XYZ-City"
              Icon={Globe}
              disabled={isLoading}
              {...register("city", { required: true })}
            />

            <Input
              type="text"
              label="Country:"
              placeholder="XYZ-Country"
              disabled={isLoading}
              Icon={Globe}
              {...register("country", { required: true })}
            />
          </div>
        </div>

        {/* SUBMIT */}
        <div className="flex justify-end">
          <Button type="submit" Icon={Save} disabled={isLoading}>
            Register
          </Button>
        </div>
      </form>
    </div>
  );
}
