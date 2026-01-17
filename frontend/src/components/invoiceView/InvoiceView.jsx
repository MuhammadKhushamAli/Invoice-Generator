import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router";
import { axiosInstance } from "../../axios/axios.js";
import { Button } from "../Button.jsx";
import { Loading } from "../Loading.jsx";
import { Error } from "../Error.jsx";
import { FileText, Download } from "lucide-react";

import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const pdfOptions = {
  cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
  cMapPacked: true,
  standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
};

export function InvoiceView() {
  const { invoiceId } = useParams();
  const [alert, setAlert] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [pages, setPages] = useState(0);
  const [invoice, setInvoice] = useState("");
  const isLoggedIn = useSelector((state) => state?.auth?.loginStatus);
  const userData = useSelector((state) => state?.auth?.userData);
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
          `/api/v1/invoice/view-invoice/${invoiceId}`,
        );

        if (invoiceResponse?.status === 200) {
          invoiceResponse.data.url = invoiceResponse?.data?.url?.replace(
            "http://",
            "https://",
          );
          setInvoice(invoiceResponse?.data);
        }
      } catch (error) {
        setAlert(error.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [invoiceId, isLoggedIn, navigate]);

  const handleDownload = () => {
    if (!invoice?.url) {
      setAlert("Invoice URL is not available for download.");

      return;
    }
    if (invoice?.url.includes("cloudinary")) {
      console.log("Downloading Invoice...");

      const url = invoice?.url?.replace("/upload/", "/upload/fl_attachment/");

      const a = document.createElement("a");

      a.href = url;

      a.download = `${userData?.businessName}-${invoice?.name}.pdf`;

      a.click();
    } else {
      window.open(invoice?.url, "_blank");
    }
  };
  return isLoading ? (
    <Loading />
  ) : (
    <div className="mx-auto w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 md:p-8">
      {/* Error Toast */}
      {alert && (
        <div className="mb-6">
          <Error message={alert} />
        </div>
      )}

      {/* Header Section */}
      <div className="mb-8 flex flex-col items-start justify-between gap-4 border-b border-slate-100 pb-6 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Invoice Preview
          </h1>
          <h4 className="mt-2 flex items-center gap-2 text-sm font-medium text-slate-500">
            <FileText className="h-4 w-4 text-indigo-500" />
            Reference No:
            <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-slate-700">
              {invoice?.name?.replace(".pdf", "")}
            </span>
          </h4>
        </div>

        {/* Desktop Placeholder for alignment (Optional) */}
        <div className="hidden md:block"></div>
      </div>

      {/* PDF Document Container */}
      <div className="flex min-h-150 flex-col items-center justify-center rounded-xl bg-slate-100/50 p-8 shadow-inner ring-1 ring-slate-900/5 backdrop-blur-sm">
        <Document
          file={invoice?.url}
          options={pdfOptions}
          className="flex flex-col gap-8"
          onLoadStart={() => setIsLoading(true)}
          onLoadSuccess={({ numPages }) => {
            setPages(numPages);
            setIsLoading(false);
          }}
          onLoadError={(error) => {
            setIsLoading(false);
            setAlert(`PDF Loading Failed ${error}`);
          }}
        >
          {Array.from({ length: pages }, (_, index) => (
            /* Page Wrapper: Adds a realistic 'Paper' shadow and lift effect */
            <div
              key={index}
              className="overflow-hidden rounded-lg shadow-lg shadow-slate-400/20 ring-1 ring-slate-900/5 transition-transform duration-300 hover:scale-[1.005]"
            >
              <Page
                pageNumber={index + 1}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                className="bg-white" // Ensures the page background is pure white
                scale={1.0}
              />
            </div>
          ))}
        </Document>
      </div>

      {/* Footer / Download Action */}
      <div className="mt-8 flex justify-end border-t border-slate-100 pt-6">
        <Button
          disabled={isLoading}
          Icon={Download}
          onClick={handleDownload}
          className="w-full shadow-lg shadow-indigo-500/20 md:w-auto"
        >
          Download Invoice
        </Button>
      </div>
    </div>
  );
}
