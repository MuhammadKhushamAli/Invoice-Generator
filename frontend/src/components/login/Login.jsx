import { useCallback } from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { axiosInstance } from "../../axios/axios.js";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router";
import { login } from "../../features/authentication/authSlice.js";
import { Error } from "../Error.jsx";
import { Input } from "../Input.jsx";
import { Button } from "../Button.jsx";
import { Mail, Lock, LogIn } from "lucide-react";

export function Login() {
  const [alert, setAlert] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit } = useForm();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const onSubmit = useCallback(
    async (data) => {
      setIsLoading(true);
      setAlert("");

      try {
        const loginResponse = await axiosInstance.patch(
          "/api/v1/user/login",
          data
        );
        if (loginResponse.status === 200) {
          dispatch(login({ userData: loginResponse.data.user }));
          navigate("/");
        } else {
          setAlert(loginResponse.message);
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
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      {/* Error Component (Logically same place) */}
      {alert && <Error message={alert} />}

      {/* Card Container */}
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-xl shadow-slate-200/50 ring-1 ring-slate-900/5">
        {/* Header Text (Visual enhancement) */}
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            Welcome Back
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Please enter your credentials to access the portal.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
          <div className="space-y-5">
            <Input
              type="text"
              label="Email Address" // Updated text for formality
              placeholder="name@company.com"
              disabled={isLoading}
              Icon={Mail} // Using the Mail icon
              {...register("email", { required: true })}
            />
            <Input
              type="password"
              label="Password"
              placeholder="••••••••"
              disabled={isLoading}
              Icon={Lock} // Using the Lock icon
              {...register("password", { required: true })}
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 shadow-indigo-500/20" // Full width button
            Icon={LogIn}
          >
            Sign In
          </Button>
        </form>
      </div>
    </div>
  );
}
