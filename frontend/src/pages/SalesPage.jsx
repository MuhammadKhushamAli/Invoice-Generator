import { useEffect, useRef, useState } from "react";
import { axiosInstance } from "../axios/axios.js";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { Container, Error, Loading, SaleLog } from "../components";

export function SalesPage() {
  const isLoggedIn = useSelector((state) => state?.auth?.loginStatus);
  const userData = useSelector((state) => state?.auth?.userData);
  const [currentPage, setCurrentPage] = useState(1);
  const [sales, setSales] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [alert, setAlert] = useState("");
  const isNextPage = useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
    const controller = new AbortController();
    const fetchSales = async () => {
      try {
        if (isLoggedIn) {
          setAlert("");
          setIsLoading(true);

          const salesResponse = await axiosInstance.get(
            "/api/v1/user/get-sales",
            {
              params: { userId: userData?._id, page: currentPage },
              signal: controller.signal,
            }
          );
          if (salesResponse?.status === 200) {
            const newSales = salesResponse?.data?.docs?.[0] || [];
            setSales((prev) => [...prev, ...newSales]);
            isNextPage.current = salesResponse?.data?.hasNextPage;
          }
        } else {
          navigate("/login");
        }
      } catch (error) {
        setAlert(error.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSales();
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
      {alert && <Error message={alert} />}
      {/* Expand container width for grid layout */}
      {/* Page Header */}
      <div className="mb-8 flex flex-col gap-2 border-b border-slate-200 pb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Sales History
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Track your recent transactions and revenue.
          </p>
        </div>

        {/* Record Counter Badge */}
        <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
          {sales?.length || 0} Transactions
        </span>
      </div>
      {/* Sales Grid Layout */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sales?.map((sale) => (
          <SaleLog key={sale?._id} sale={sale} />
        ))}

        {/* Empty State Visual (Does not affect logic) */}
        {sales?.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-center text-slate-500">
            <p>No sales records found.</p>
          </div>
        )}
      </div>
    </Container>
  );
}
