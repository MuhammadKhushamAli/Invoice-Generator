import { useState, useEffect, useRef, useMemo } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router";
import { axiosInstance } from "../../axios/axios.js";
import { Button } from "../Button.jsx";
import { Loading } from "../Loading.jsx";
import { Error } from "../Error.jsx";
import { Download, ClipboardList } from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";
import { useQuery } from "@tanstack/react-query";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const pdfOptions = {
  cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
  cMapPacked: true,
  standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
};

export function QuotationView() {
  const { quotationId } = useParams();
  const [pages, setPages] = useState(0);
  const [pdfWidth, setPdfWidth] = useState(null);
  const isLoggedIn = useSelector((state) => state?.auth?.loginStatus);
  const userData = useSelector((state) => state?.auth?.userData);
  const navigate = useNavigate();
  const pdfWraperRef = useRef(null);

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ["view-quotation", quotationId],
    queryFn: async () => {
      const quotationResponse = await axiosInstance.get(
        `/api/v1/quotation/view-quotation/${quotationId}`,
      );
      return quotationResponse?.data;
    },
    select: (data) => ({
      ...data,
      url: data?.url?.replace("http://", "https://"),
    }),
    enabled: !!quotationId && isLoggedIn,
    staleTime: 5 * 60 * 1000,
    cacheTime: 15 * 60 * 1000,
    refetchOnMount: true,
  });
  const quotation = useMemo(() => data, [data]);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
    }
  }, [isLoggedIn]);

  useEffect(() => {
    const updatePdfWidth = () => {
      if (pdfWraperRef.current) {
        if (pdfWraperRef.current.clientWidth <= 768)
          setPdfWidth(pdfWraperRef.current.clientWidth);
        else setPdfWidth(null);
      }
    };
    const timeoutId = setTimeout(updatePdfWidth, 0);

    window.addEventListener("resize", updatePdfWidth);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", updatePdfWidth);
    };
  }, [isLoading]);

  const handleDownload = () => {
    if (!quotation?.url) {
      setAlert("Invoice URL is not available for download.");

      return;
    }
    if (quotation?.url.includes("cloudinary")) {
      const url = quotation?.url?.replace(
        "/upload/",
        `/upload/fl_attachment:${userData?.businessName}-${quotation?.name}/`,
      );

      const a = document.createElement("a");

      a.href = url;

      a.click();
    } else {
      window.open(quotation?.url, "_blank");
    }
  };

  return isLoading || isFetching ? (
    <Loading />
  ) : (
    /* 1. Added 'max-w-5xl' here to stop the container from getting too wide on huge screens */
    <div className="mx-auto w-full max-w-5xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 md:p-8">
      {/* Error Toast */}
      {isError && (
        <div className="mb-6">
          <Error message={error?.message} />
        </div>
      )}

      {/* Header Section */}
      <div className="mb-8 flex flex-col items-start justify-between gap-4 border-b border-slate-100 pb-6 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Quotation Preview
          </h1>
          <h4 className="mt-2 flex items-center gap-2 text-sm font-medium text-slate-500">
            <ClipboardList className="h-4 w-4 text-indigo-500" />
            Reference No:
            <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-slate-700">
              {quotation?.name?.replace(".pdf", "")}
            </span>
          </h4>
        </div>

        {/* Desktop Placeholder for alignment */}
        <div className="hidden md:block"></div>
      </div>

      {/* PDF Document Container */}
      <div className="flex min-h-150 flex-col items-center justify-center rounded-xl bg-slate-100/50 p-4 shadow-inner ring-1 ring-slate-900/5 backdrop-blur-sm md:p-8">
        <div ref={pdfWraperRef} className="w-full">
          <Document
            file={quotation?.url}
            options={pdfOptions}
            /* 2. Added 'items-center' here. This forces the PDF pages to center horizontally */
            className="flex flex-col gap-8 items-center"
            onLoadSuccess={({ numPages }) => {
              setPages(numPages);
            }}
          >
            {Array.from({ length: pages }, (_, index) => (
              /* Page Wrapper */
              <div
                key={index}
                className="overflow-hidden rounded-lg shadow-lg shadow-slate-400/20 ring-1 ring-slate-900/5 transition-transform duration-300 hover:scale-[1.005]"
              >
                <Page
                  pageNumber={index + 1}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  className="bg-white"
                  width={pdfWidth || undefined}
                />
              </div>
            ))}
          </Document>
        </div>
      </div>

      {/* Footer / Download Action */}
      <div className="mt-8 flex justify-end border-t border-slate-100 pt-6">
        <Button
          disabled={isLoading}
          Icon={Download}
          onClick={handleDownload}
          className="w-full shadow-lg shadow-indigo-500/20 md:w-auto"
        >
          Download Quotation
        </Button>
      </div>
    </div>
  );
}
