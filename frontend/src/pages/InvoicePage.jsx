import { useEffect, useRef, useState } from "react";
import { axiosInstance } from "../axios/axios.js";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { Container, Error, InvoiceCard, Loading } from "../components";

export function InvoicePage() {
  const isLoggedIn = useSelector((state) => state?.auth?.loginStatus);
  const userData = useSelector((state) => state?.auth?.userData);
  const [currentPage, setCurrentPage] = useState(1);
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [alert, setAlert] = useState("");
  const isNextPage = useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
    const controller = new AbortController();
    const fetchInvoices = async () => {
      try {
        if (isLoggedIn) {
          setAlert("");
          setIsLoading(true);
          const invoicesResponse = await axiosInstance.get(
            "/api/v1/user/get-invoices",
            {
              params: { userId: userData?._id, page: currentPage },
              signal: controller.signal,
            }
          );
          if (invoicesResponse?.status === 200) {
            const newInvoices =
              invoicesResponse?.data?.docs?.[0].invoices || [];
            setInvoices((prev) => [...prev, ...newInvoices]);
            isNextPage.current = invoicesResponse?.data?.hasNextPage;
          }
        } else {
          navigate("/login");
        }
      } catch (error) {
        if (error.name !== "CanceledError" || error.code !== "ERR_CANCELED")
          setAlert(error.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInvoices();
    return () => controller.abort();
  }, [currentPage, isLoggedIn]);

  useEffect(() => {
    const handleScroll = () => {
      if (isNextPage.current) {
        if (
          window.innerHeight + window.scrollY >=
          document.body?.offsetHeight - 50
        ) {
          setCurrentPage((prev) => prev + 1);
        }
      }
    };
    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return isLoading ? (
    <Loading />
  ) : (
    <Container className="max-w-7xl!">
      {" "}
      {/* Increased width for better grid view */}
      {alert && <Error message={alert} />}
      {/* Page Header */}
      <div className="mb-8 flex flex-col gap-2 border-b border-slate-200 pb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Invoice History
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            View and download your past generated invoices.
          </p>
        </div>
        {/* Counter Badge */}
        <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          {invoices?.length || 0} Records Found
        </span>
      </div>
      {/* Invoices Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {invoices?.map((invoice) => (
          <InvoiceCard key={invoice?._id} invoice={invoice} />
        ))}

        {/* Empty State Handling (Visual only, does not break logic) */}
        {invoices?.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-center text-slate-500">
            <p>No invoices found.</p>
          </div>
        )}
      </div>
    </Container>
  );
}
