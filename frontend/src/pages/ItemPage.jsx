import { useEffect, useRef, useState } from "react";
import { axiosInstance } from "../axios/axios.js";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { Container, Error, ItemCard, Loading } from "../components/index.js";

export function ItemPage() {
  const isLoggedIn = useSelector((state) => state?.auth?.loginStatus);
  const userData = useSelector((state) => state?.auth?.userData);
  const [currentPage, setCurrentPage] = useState(1);
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [alert, setAlert] = useState("");
  const isNextPage = useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
    const controller = new AbortController();
    const fetchItems = async () => {
    try {
      if (!isLoggedIn) {
        setAlert("");
        setIsLoading(true);

        const itemsResponse = await axiosInstance.get(
          "/api/v1/user/get-items",
          {
            params: { userId: userData?._id, page: currentPage },
            signal: controller.signal,
          }
        );
        if (itemsResponse?.status === 200) {
          const newItems = itemsResponse?.data?.docs?.[0] || [];
          setItems((prev) => [...prev, ...newItems]);
          isNextPage.current = itemsResponse?.data?.hasNextPage;
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
    fetchItems();
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
      {alert && <Error message={alert} />}{" "}
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
          {items?.length || 0} Products Available
        </span>
      </div>
      {/* Global Error Message */}
      {alert && (
        <div className="mb-6">
          <Error message={alert} />
        </div>
      )}
      {/* Product Grid Layout */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items?.map((item) => (
          <ItemCard key={item?._id} item={item} />
        ))}

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
