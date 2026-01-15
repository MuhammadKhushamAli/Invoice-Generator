import { useEffect, useRef } from "react";
import { axiosInstance } from "../axios/axios.js";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { Container, Error, ItemCard, Loading } from "../components";

export function InvoicePage() {
  const isLoggedIn = useSelector((state) => state?.auth?.loginStatus);
  const userData = useSelector((state) => state?.auth?.userData);
  const [currentPage, setCurrentPage] = useState(1);
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [alert, setAlert] = useState("");
  const isNextPage = useRef(false);
  const navigate = useNavigate();

  useEffect(async () => {
    const controller = new AbortController();
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
    <Container>
      {alert && <Error message={alert} />}
      {items?.map((item) => (
        <ItemCard key={item?._id} item={item} />
      ))}
    </Container>
  );
}
