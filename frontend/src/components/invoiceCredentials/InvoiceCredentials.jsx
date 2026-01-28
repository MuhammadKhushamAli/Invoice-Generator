import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { axiosInstance } from "../../axios/axios";
import { useDropzone } from "react-dropzone";
import { Button } from "../Button.jsx";
import { Error } from "../Error.jsx";
import {
  UploadCloud,
  Image,
  Stamp,
  PenTool,
  CheckCircle,
  X,
} from "lucide-react";
import { useState } from "react";
import { Loading } from "../Loading.jsx";
import { login } from "../../features/authentication/authSlice.js";

export function InvoiceCredentials({ onClick = null }) {
  const [alert, setAlert] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [logo, setLogo] = useState(null);
  const [stamp, setStamp] = useState(null);
  const [sign, setSign] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [stampPreview, setStampPreview] = useState(null);
  const [signPreview, setSignPreview] = useState(null);
  const isLoggedIn = useSelector((state) => state?.auth?.loginStatus);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // just for Login Check
  useEffect(() => {
    setIsLoading(true);
    if (!isLoggedIn) {
      navigate("/login");
    }
    setIsLoading(false);
  }, [isLoggedIn]);

  const onDrop = useCallback(
    (type) => (file) => {
      const image = file[0];
      if (type === "logo") {
        setLogo(image);
        setLogoPreview(URL.createObjectURL(image));
      } else if (type === "stamp") {
        setStamp(image);
        setStampPreview(URL.createObjectURL(image));
      } else if (type === "sign") {
        setSign(image);
        setSignPreview(URL.createObjectURL(image));
      }
    },
    []
  );

  const onSubmit = async () => {
    setAlert("");
    setIsLoading(true);
    try {
      if (logo !== null && stamp !== null && sign !== null) {
        const formData = new FormData();
        formData.append("sign", sign, "sign.png");
        formData.append("logo", logo, "logo.png");
        formData.append("stamp", stamp, "stamp.png");

        const response = await axiosInstance.patch(
          "api/v1/user/set-invoice-credentials",
          formData
        );
        if (response?.status === 200) {
          dispatch(login({ userData: response?.data }));
          setAlert(response?.message);
          onClick ? onClick() : navigate("/");
        }
      } else {
        setAlert("Please Upload All Credentials");
      }
    } catch (error) {
      setAlert(error?.message);
    } finally {
      setIsLoading(false);
    }
  };

  const logoDropzone = useDropzone({ onDrop: onDrop("logo") });
  const stampDropzone = useDropzone({ onDrop: onDrop("stamp") });
  const signDropzone = useDropzone({ onDrop: onDrop("sign") });

  return isLoading ? (
    <Loading />
  ) : (
    <div className="relative mx-auto w-full max-w-5xl rounded-xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 md:p-10">
      {/* Error Component */}
      {alert && <Error message={alert} />}

      {/* Header Section */}
      <div className="mb-8 border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Invoice Credentials
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Upload or preview your business assets.
        </p>
      </div>

      {/* Close Button (Styled as Icon) */}
      {onClick && (
        <div className="absolute right-4 top-4 md:right-8 md:top-8 z-10">
          <Button
            onClick={onClick}
            Icon={X}
            className="h-10 w-10 rounded-full! border border-slate-200! bg-white! p-0! text-slate-400! shadow-sm hover:bg-slate-50! hover:text-slate-700! [&_svg]:mr-0! [&_svg]:h-5! [&_svg]:w-5!"
          />
        </div>
      )}

      {/* Grid Layout */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* ---------------- LOGO SECTION ---------------- */}
        <div className="flex flex-col gap-3">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Image className="h-4 w-4 text-indigo-500" />
            Business Logo
          </h4>

          {logoPreview ? (
            <div className="relative flex h-48 w-full items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-2">
              <img
                src={logoPreview}
                alt="Logo"
                className="h-full w-full object-contain" // Prevents stretching (keeps aspect ratio)
              />
              {/* Visual badge to show it is uploaded */}
              <div className="absolute right-2 top-2 rounded-full bg-green-100 p-1 text-green-600">
                <CheckCircle className="h-4 w-4" />
              </div>
            </div>
          ) : (
            <div
              {...logoDropzone.getRootProps()}
              className="group relative flex h-48 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 transition-all hover:border-indigo-500 hover:bg-indigo-50/50"
            >
              <input {...logoDropzone.getInputProps()} className="hidden" />
              <div className="flex flex-col items-center text-center p-4">
                <div className="mb-3 rounded-full bg-white p-3 shadow-sm ring-1 ring-slate-900/5 group-hover:scale-110 transition-transform">
                  <UploadCloud className="h-6 w-6 text-slate-400 group-hover:text-indigo-600" />
                </div>
                <p className="text-xs font-medium text-slate-600">
                  Upload Logo
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ---------------- STAMP SECTION ---------------- */}
        <div className="flex flex-col gap-3">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Stamp className="h-4 w-4 text-indigo-500" />
            Business Stamp
          </h4>

          {stampPreview ? (
            <div className="relative flex h-48 w-full items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-2">
              <img
                src={stampPreview}
                alt="stamp"
                className="h-full w-full object-contain"
              />
              <div className="absolute right-2 top-2 rounded-full bg-green-100 p-1 text-green-600">
                <CheckCircle className="h-4 w-4" />
              </div>
            </div>
          ) : (
            <div
              {...stampDropzone.getRootProps()}
              className="group relative flex h-48 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 transition-all hover:border-indigo-500 hover:bg-indigo-50/50"
            >
              <input {...stampDropzone.getInputProps()} className="hidden" />
              <div className="flex flex-col items-center text-center p-4">
                <div className="mb-3 rounded-full bg-white p-3 shadow-sm ring-1 ring-slate-900/5 group-hover:scale-110 transition-transform">
                  <UploadCloud className="h-6 w-6 text-slate-400 group-hover:text-indigo-600" />
                </div>
                <p className="text-xs font-medium text-slate-600">
                  Upload Stamp
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ---------------- SIGN SECTION ---------------- */}
        <div className="flex flex-col gap-3">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <PenTool className="h-4 w-4 text-indigo-500" />
            Authorized Signature
          </h4>

          {signPreview ? (
            <div className="relative flex h-48 w-full items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-2">
              <img
                src={signPreview}
                alt="Sign"
                className="h-full w-full object-contain"
              />
              <div className="absolute right-2 top-2 rounded-full bg-green-100 p-1 text-green-600">
                <CheckCircle className="h-4 w-4" />
              </div>
            </div>
          ) : (
            <div
              {...signDropzone.getRootProps()}
              className="group relative flex h-48 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 transition-all hover:border-indigo-500 hover:bg-indigo-50/50"
            >
              <input {...signDropzone.getInputProps()} className="hidden" />
              <div className="flex flex-col items-center text-center p-4">
                <div className="mb-3 rounded-full bg-white p-3 shadow-sm ring-1 ring-slate-900/5 group-hover:scale-110 transition-transform">
                  <UploadCloud className="h-6 w-6 text-slate-400 group-hover:text-indigo-600" />
                </div>
                <p className="text-xs font-medium text-slate-600">
                  Upload Signature
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Action */}
      <div className="mt-10 flex justify-end border-t border-slate-100 pt-6">
        <Button onClick={onSubmit} Icon={CheckCircle} className="min-w-30">
          Submit
        </Button>
      </div>
    </div>
  );
}
