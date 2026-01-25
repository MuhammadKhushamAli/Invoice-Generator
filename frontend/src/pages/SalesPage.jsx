import { useEffect, useRef, useMemo } from "react";
import { axiosInstance } from "../axios/axios.js";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { Container, Error, Loading, SaleLog } from "../components";
import { useInfiniteQuery } from "@tanstack/react-query";
import { BarChart3 } from "lucide-react";

export function SalesPage() {
  const isLoggedIn = useSelector((state) => state?.auth?.loginStatus);
  const userData = useSelector((state) => state?.auth?.userData);
  const navigate = useNavigate();

  const {
    data,
    isLoading,
    isError,
    error,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ["sales", userData?._id],
    queryFn: async ({ pageParam = 1 }) => {
      const salesResponse = await axiosInstance.get(
        "/api/v1/user/get-sale-history",
        {
          params: { userId: userData?._id, page: pageParam },
        },
      );
      return salesResponse?.data;
    },
    getNextPageParam: (lastPage, pages) => {
      return lastPage?.hasNextPage ? pages.length + 1 : undefined;
    },
    keepPreviousData: true,
    enabled: isLoggedIn,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 5 * 60 * 1000,
    cacheTime: 15 * 60 * 1000,
  });

  const isFetchingNextPageRef = useRef(isFetchingNextPage);
  const hasNextRef = useRef(hasNextPage);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
    }
  }, [isLoggedIn]);

  useEffect(() => {
    isFetchingNextPageRef.current = isFetchingNextPage;
    hasNextRef.current = hasNextPage;
  }, [hasNextPage, isFetchingNextPage]);

  useEffect(() => {
    const handleScroll = () => {
      if (hasNextRef.current && !isFetchingNextPageRef.current) {
        if (
          window.innerHeight + window.scrollY >=
          document.body?.offsetHeight - 50
        ) {
          fetchNextPage();
        }
      }
    };
    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, [fetchNextPage]);

  const sales = useMemo(
    () => data?.pages?.flatMap((page) => page?.docs?.[0]?.sales),
    [data],
  );

  return isLoading ? (
    <Loading />
  ) : (
    <Container className="max-w-7xl! py-8">
      {" "}
      {/* Expand container width for grid layout */}
      {/* Page Header */}
      <div className="mb-10 flex flex-col gap-6 border-b border-slate-100 pb-8 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          {/* Icon Accent - Consistent with Delivery Card tone */}
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 shadow-sm ring-1 ring-indigo-100">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Sales History
            </h1>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Track your recent transactions and revenue.
            </p>
          </div>
        </div>

        {isError && <Error message={error?.message} />}
        {/* Record Counter Badge */}
        <div className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 shadow-sm ring-1 ring-slate-200">
          <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
          <span className="text-sm font-semibold text-slate-700">
            {sales?.length || 0} Sales Available
          </span>
        </div>
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
        {isFetchingNextPage && <h2>loading...</h2>}
      </div>
    </Container>
  );
}
