import { useEffect, useMemo, useRef } from "react";
import { axiosInstance } from "../axios/axios.js";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router";
import {
  Container,
  Error,
  Loading,
  DeliveryInvoiceCard,
} from "../components/index.js";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Truck } from "lucide-react";

export function DeliveryChallanPage() {
  const isLoggedIn = useSelector((state) => state?.auth?.loginStatus);
  const userData = useSelector((state) => state?.auth?.userData);
  const navigate = useNavigate();

  const {
    data,
    fetchNextPage,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    isError,
    error,
  } = useInfiniteQuery({
    queryKey: ["deliveryChallans", userData?._id],
    queryFn: async ({ pageParam = 1 }) => {
      const deliveryChallanResponse = await axiosInstance.get(
        "/api/v1/user/get-delivery-challan",
        {
          params: { userId: userData?._id, page: pageParam },
        },
      );
      return deliveryChallanResponse?.data;
    },
    getNextPageParam: (lastPage, pages) => {
      return lastPage.hasNextPage ? pages.length + 1 : undefined;
    },
    keepPreviousData: true,
    enabled: isLoggedIn,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 5 * 60 * 1000,
    cacheTime: 15 * 60 * 1000,
  });

  const fetchingNextPage = useRef(isFetchingNextPage);
  const hasNext = useRef(hasNextPage);

  useEffect(() => {
    fetchingNextPage.current = isFetchingNextPage;
    hasNext.current = hasNextPage;
  }, [isFetchingNextPage, hasNextPage]);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
    }
  }, [isLoggedIn]);

  useEffect(() => {
    const handleScroll = () => {
      if (hasNext.current && !fetchNextPage.current) {
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

  console.log(data);
  const deliveryChallans = useMemo(
    () =>
      data?.pages?.flatMap((page) => page?.docs?.[0]?.deliveryChallans) || [],
    [data],
  );

  return isLoading ? (
    <Loading />
  ) : (
    <Container className="max-w-7xl! py-8">
      {/* Page Header */}
      <div className="mb-10 flex flex-col gap-6 border-b border-slate-100 pb-8 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          {/* Icon Accent - Consistent with Delivery Card tone */}
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 shadow-sm ring-1 ring-indigo-100">
            <Truck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Delivery Challans
            </h1>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Manage and track your official shipment and delivery records.
            </p>
          </div>
        </div>

        {/* Item Counter Badge */}
        <div className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 shadow-sm ring-1 ring-slate-200">
          <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
          <span className="text-sm font-semibold text-slate-700">
            {deliveryChallans?.length || 0} Challans Available
          </span>
        </div>
      </div>

      {/* Global Error Message */}
      {isError && (
        <div className="mb-8">
          <Error message={error?.message} />
        </div>
      )}

      {/* Product Grid Layout */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {deliveryChallans?.map((deliveryChallan) => (
          <DeliveryInvoiceCard
            key={deliveryChallan?._id}
            delviveryChallan={deliveryChallan}
          />
        ))}

        {/* Loading State for Pagination */}
        {isFetchingNextPage && (
          <div className="col-span-full flex justify-center py-10">
            <div className="flex items-center gap-3 text-slate-500">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
              <span className="text-sm font-medium">
                Loading more records...
              </span>
            </div>
          </div>
        )}

        {/* Empty State */}
        {deliveryChallans?.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 py-24 text-center">
            <div className="mb-4 rounded-full bg-slate-50 p-4 text-slate-300">
              <Truck size={48} strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">
              No Challans Found
            </h3>
            <p className="mt-1 text-sm text-slate-500 max-w-xs">
              There are no delivery challan documents available to display at
              this time.
            </p>
          </div>
        )}
      </div>
    </Container>
  );
}
