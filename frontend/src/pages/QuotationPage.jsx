import { useEffect, useMemo, useRef } from "react";
import { axiosInstance } from "../axios/axios.js";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { Container, Error, ItemCard, Loading } from "../components/index.js";
import { useInfiniteQuery } from "@tanstack/react-query";

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
    queryKey: ["quotations", userData?._id],
    queryFn: async ({ pageParam = 1 }) => {
      const quotationResponse = await axiosInstance.get("/api/v1/user/get-quotations", {
        params: { userId: userData?._id, page: pageParam },
      });
      return quotationResponse?.data;
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

  const quotations = useMemo(() => (data?.pages?.flatMap(page => page?.docs?.[0]?.quotations) || []), [data]);

  return isLoading ? (
    <Loading />
  ) : (
    <Container className="max-w-7xl!">
      {" "}
      {/* Wider container for product grid */}
      {/* Page Header */}
      <div className="mb-8 flex flex-col gap-2 border-b border-slate-200 pb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Product Catalog
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Browse and add items to your cart for invoicing.
          </p>
        </div>

        {/* Item Counter Badge */}
        <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          {quotations?.length || 0} Products Available
        </span>
      </div>
      {/* Global Error Message */}
      {isError && (
        <div className="mb-6">
          <Error message={error?.message} />
        </div>
      )}
      {/* Product Grid Layout */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {quotations?.map((quotation) => {
            return <ItemCard key={quotation?._id} item={quotation} />;
        })}
        {
          isFetchingNextPage && (
            <h2>loading...</h2>
          )
        }

        {/* Empty State */}
        {quotations?.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-center text-slate-500">
            <p>No items found in the inventory.</p>
          </div>
        )}
      </div>
    </Container>
  );
}
