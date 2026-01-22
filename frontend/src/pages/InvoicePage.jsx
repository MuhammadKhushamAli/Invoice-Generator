import { useEffect, useMemo, useRef } from "react";
import { axiosInstance } from "../axios/axios.js";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { Container, Error, InvoiceCard, Loading } from "../components";
import { useInfiniteQuery } from "@tanstack/react-query";

export function InvoicePage() {
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
    queryKey: ["invoices", userData?._id],
    queryFn: async ({ pageParam = 1 }) => {
      const invoicesResponse = await axiosInstance.get(
        "/api/v1/user/get-invoices",
        {
          params: { userId: userData?._id, page: pageParam },
        },
      );
      return invoicesResponse?.data;
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

  const invoices = useMemo(
    () => data?.pages?.flatMap((page) => page?.docs?.[0]?.invoices),
    [data],
  );


  return isLoading ? (
    <Loading />
  ) : (
    <Container className="max-w-7xl!">
      {" "}
      {/* Increased width for better grid view */}
      {isError && <Error message={error?.message} />}
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
        {isFetchingNextPage && <h2>loading...</h2>}
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
