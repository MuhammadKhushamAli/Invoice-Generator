import { useEffect, useMemo, useRef } from "react";
import { axiosInstance } from "../axios/axios.js";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { Container, Error, ItemCard, Loading } from "../components/index.js";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Package } from "lucide-react";

export function ItemPage() {
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
    queryKey: ["items", userData?._id],
    queryFn: async ({ pageParam = 1 }) => {
      const itemsResponse = await axiosInstance.get("/api/v1/user/get-items", {
        params: { userId: userData?._id, page: pageParam },
      });
      return itemsResponse?.data;
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

  const items = useMemo(
    () => data?.pages?.flatMap((page) => page?.docs?.[0]?.items) || [],
    [data],
  );

  return isLoading ? (
    <Loading />
  ) : (
    <Container className="max-w-7xl! py-8">
      {" "}
      {/* Wider container for product grid */}
      {/* Page Header */}
      <div className="mb-10 flex flex-col gap-6 border-b border-slate-100 pb-8 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          {/* Icon Accent - Consistent with Delivery Card tone */}
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 shadow-sm ring-1 ring-indigo-100">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Product Catalog
            </h1>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Browse and add items to your cart for invoicing.
            </p>
          </div>
        </div>

        {/* Item Counter Badge */}
        <div className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 shadow-sm ring-1 ring-slate-200">
          <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
          <span className="text-sm font-semibold text-slate-700">
            {items?.length || 0} Items Available
          </span>
        </div>
      </div>
      {/* Global Error Message */}
      {isError && (
        <div className="mb-6">
          <Error message={error?.message} />
        </div>
      )}
      {/* Product Grid Layout */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items?.map((item) => {
          return <ItemCard key={item?._id} item={item} />;
        })}
        {isFetchingNextPage && <h2>loading...</h2>}

        {/* Empty State */}
        {items?.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-center text-slate-500">
            <p>No items found in the inventory.</p>
          </div>
        )}
      </div>
    </Container>
  );
}
