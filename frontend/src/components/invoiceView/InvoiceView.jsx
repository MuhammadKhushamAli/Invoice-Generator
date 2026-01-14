import { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router";
import { axiosInstance } from "../../axios/axios.js";
import { Document, Page } from "react-pdf";
import { Button } from "../Button.jsx";
import { Loading } from "../Loading.jsx";
import { Error } from "../Error.jsx";
import { Download, FileText } from "lucide-react";

export function InvoiceView() {
  const { itemId } = useParams();
  const [alert, setAlert] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [pages, setPages] = useState(0);
  const [invoice, setInvoice] = useState(null);
  const isLoggedIn = useSelector((state) => state?.auth?.loginStatus);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      if (!isLoggedIn) {
        navigate("/login");
      }
      setAlert("");
      setIsLoading(true);
      try {
        const invoiceResponse = await axiosInstance.get(
          `/api/v1/item/view-item/${itemId}`
        );

        if (invoiceResponse?.status === 200) {
          setInvoice(invoiceResponse?.data);
        }
      } catch (error) {
        setAlert(error.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [itemId]);
  return isLoading ? (
    <Loading />
  ) : (
    <div className="mx-auto min-h-screen max-w-5xl px-4 py-8">
      {/* Error Toast */}
      {alert && <Error message={alert} />}

      {/* Header Section */}
      <div className="mb-6 flex flex-col items-start justify-between gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Invoice Preview
          </h1>
          <h4 className="mt-2 flex items-center gap-2 text-sm font-medium text-slate-500">
            <FileText className="h-4 w-4 text-indigo-500" />
            Reference No:
            <span className="font-mono text-slate-700">
              {(invoice?.name).replace(".pdf", "")}
            </span>
          </h4>
        </div>

        {/* Download Button (Placed top right for better UX, but code structure kept linear) */}
        <div className="hidden md:block">
          {/* This is a duplicate placement for desktop layout visual, 
             but I will keep your original button at the bottom as requested. */}
        </div>
      </div>

      {/* PDF Document Container */}
      <div className="flex min-h-150 flex-col items-center justify-center rounded-xl bg-slate-100/80 p-6 shadow-inner ring-1 ring-slate-900/5 backdrop-blur-sm">
        <Document
          file={invoice?.url}
          className="flex flex-col gap-8" // Adds space between multiple pages
          onLoadSuccess={({ numPages }) => {
            setPages(numPages);
            setIsLoading(false);
          }}
          onLoadError={() => {
            setIsLoading(false);
            setAlert("PDF Loading Failed");
            navigate(-1);
          }}
          onLoadStart={() => setIsLoading(true)}
        >
          {Array.from({ length: pages }, (_, index) => (
            /* Wrapper div to add shadow/rounded corners to the canvas Page */
            <div
              key={index}
              className="overflow-hidden rounded-lg shadow-lg shadow-slate-400/20 ring-1 ring-slate-900/5 transition-transform hover:scale-[1.005]"
            >
              <Page
                pageNumber={index + 1}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                className="bg-white" // Ensures the page background is white
              />
            </div>
          ))}
        </Document>
      </div>

      {/* Footer / Download Action */}
      <div className="mt-6 flex justify-end">
        <Button
          disabled={isLoading}
          Icon={Download}
          className="w-full shadow-lg shadow-indigo-500/20 md:w-auto"
        >
          <a
            href={invoice?.url}
            download={invoice?.name}
            target="_blank"
            className="flex items-center gap-2 text-inherit no-underline"
            rel="noreferrer"
          >
            Download Invoice
          </a>
        </Button>
      </div>
    </div>
  );
}
