import { useCallback, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { axiosInstance } from "../../axios/axios";
import { useDropzone } from "react-dropzone";
import { Button } from "../Button.jsx";
import { Error } from "../Error.jsx";
import {
  X,
  Camera,
  UploadCloud,
  Trash2,
  Save,
  Tag,
  DollarSign,
  Package,
  Layers,
  Palette,
} from "lucide-react";
import Webcam from "react-webcam";
import { useState } from "react";
import { Loading } from "../Loading.jsx";
import { useForm } from "react-hook-form";
import { Input } from "../Input.jsx";

export function AddItem({ onClick = null }) {
  const [alert, setAlert] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isCaptured, setIsCaptured] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const isLoggedIn = useSelector((state) => state?.auth?.loginStatus);
  const webCamRef = useRef(null);
  const navigate = useNavigate();
  const { register, handleSubmit } = useForm();

  // just for Login Check
  useEffect(() => {
    setIsLoading(true);
    if (!isLoggedIn) {
      navigate("/login");
    }
    setIsLoading(false);
  }, [isLoggedIn]);

  const dataURLtoBlob = useCallback((dataURL) => {
    const arr = dataURL.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    return new Blob([u8arr], { type: mime });
  }, []);

  const onDrop = useCallback((file) => {
    const image = file[0];
    setImage(image);
    setPreview(URL.createObjectURL(image));
    setIsCaptured(false);
  }, []);

  const onSubmit = async (data) => {
    setAlert("");
    setIsLoading(true);
    try {
      if (image !== null) {
        let readyImage = image;

        if (isCaptured) {
          readyImage = dataURLtoBlob(image);
        }

        const formData = new FormData();
        formData.append("image", readyImage, "image.jpeg");

        for (const key in data) {
          const value = data[key];
          formData.append(
            key,
            typeof value === "object" ? JSON.stringify(value) : value
          );
        }

        const response = await axiosInstance.post(
          "/api/v1/item/add-item",
          formData
        );
        if (response?.status === 200){
          setAlert(response?.message);
          onClick && onClick();
          if (window.location.pathname === "/products")
            window.location.reload();
        };
      } else {
        setAlert("Please Upload Image");
      }
    } catch (error) {
        console.log(error);
      setAlert(error?.message);
    } finally {
      setIsLoading(false);
      setIsCaptured(false);
      setImage(null);
      setPreview(null);
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: false,
  });

  const capture = useCallback(() => {
    const imageCaptured = webCamRef?.current?.getScreenshot();
    setIsCapturing(false);
    setIsCaptured(true);
    setImage(imageCaptured);
    setPreview(imageCaptured);
  }, []);

  return isLoading ? (
    <Loading />
  ) : (
    <div className="relative mx-auto w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 md:p-8">
      {/* Header */}
      <div className="mb-6 border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Add New Item
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Enter product details and upload an image.
        </p>
      </div>

      {/* Close Button (Absolute Top-Right) */}
      {onClick && (
        <div className="absolute right-4 top-4 z-10 md:right-6 md:top-6">
          <Button
            onClick={onClick}
            Icon={X}
            className="h-10 w-10 rounded-full! border border-slate-200! bg-white! p-0! text-slate-400! shadow-sm hover:bg-slate-50! hover:text-slate-700! [&_svg]:mr-0! [&_svg]:h-5! [&_svg]:w-5!"
          />
        </div>
      )}

      {/* Error Toast */}
      {alert && <Error message={alert} />}
      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* Input Fields Grid */}
        <div className="grid gap-5 md:grid-cols-2">
          {/* Full width for Name */}
          <div className="col-span-full">
            <Input
              type="text"
              label="Item Name:"
              placeholder="XYZ"
              Icon={Tag}
              {...register("name", { required: true })}
            />
          </div>

          <Input
            type="number"
            label="Price:"
            placeholder="123"
            Icon={DollarSign}
            {...register("price", {
              required: true,
              validate: (value) => value >= 0,
            })}
          />

          <Input
            type="number"
            label="Available Quantity:"
            placeholder="123"
            Icon={Package}
            {...register("quantity", {
              required: true,
              validate: (value) => value >= 0,
            })}
          />

          <Input
            type="text"
            label="Range:"
            placeholder="XYZ"
            Icon={Layers}
            {...register("range")}
          />

          <Input
            type="text"
            label="Design:"
            placeholder="XYZ"
            Icon={Palette}
            {...register("design")}
          />
        </div>

        {/* Image Processing Section */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-slate-700">
            Item Image
          </label>

          {preview ? (
            /* PREVIEW STATE */
            <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-2">
              <img
                src={preview}
                alt="Item Preview"
                className="h-64 w-full object-contain rounded-md"
              />
              {/* Remove Button */}
              <div className="absolute right-4 top-4">
                <Button
                  onClick={() => {
                    setIsCaptured(false);
                    setImage(null);
                    setPreview(null);
                  }}
                  Icon={Trash2}
                  className="bg-white/90! text-red-600! border border-red-100 shadow-sm hover:bg-red-50!"
                >
                  Remove
                </Button>
              </div>
            </div>
          ) : isCapturing ? (
            /* WEBCAM STATE */
            <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-black">
              <Webcam
                audio={false}
                ref={webCamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={{ facingMode: "environment" }}
                className="h-64 w-full object-cover"
              />
              {/* Webcam Controls */}
              <div className="absolute bottom-4 inset-x-0 flex justify-center gap-3">
                <Button
                  onClick={() => setIsCapturing(false)}
                  className="bg-white/20! backdrop-blur-md text-white! hover:bg-white/30! border border-white/20"
                  Icon={X}
                >
                  Close
                </Button>
                <Button
                  onClick={capture}
                  className="bg-indigo-600! text-white! shadow-lg shadow-indigo-500/40 hover:bg-indigo-500!"
                  Icon={Camera}
                >
                  Capture
                </Button>
              </div>
            </div>
          ) : (
            /* DROPZONE STATE */
            <div className="relative">
              <div
                {...getRootProps()}
                className="group flex h-48 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 transition-all hover:border-indigo-500 hover:bg-indigo-50/50"
              >
                <input {...getInputProps()} className="hidden" />

                <div className="flex flex-col items-center gap-2 text-center p-4">
                  <div className="rounded-full bg-white p-3 shadow-sm ring-1 ring-slate-900/5 transition-transform group-hover:scale-110">
                    <UploadCloud className="h-6 w-6 text-slate-400 group-hover:text-indigo-600" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-700">
                      Click to upload or drag & drop
                    </p>
                    <p className="text-xs text-slate-500">
                      JPG, PNG or GIF (max 800x800)
                    </p>
                  </div>
                </div>
              </div>

              {/* Camera Trigger (Floating inside Dropzone area) */}
              <div
                className="absolute top-3 right-3"
                onClick={(e) => e.stopPropagation()}
              >
                <Button
                  type="button"
                  onClick={() => setIsCapturing(true)}
                  className="h-8! px-3! text-xs! bg-white! border border-slate-200 text-indigo-600! hover:bg-indigo-50!"
                  Icon={Camera}
                >
                  Use Camera
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer / Submit Button */}
        <div className="mt-8 flex justify-end border-t border-slate-100 pt-6">
          <Button
            type="submit"
            Icon={Save}
            className="w-full shadow-lg shadow-indigo-500/20 md:w-auto md:min-w-37.5"
          >
            Save Item
          </Button>
        </div>
      </form>
    </div>
  );
}
