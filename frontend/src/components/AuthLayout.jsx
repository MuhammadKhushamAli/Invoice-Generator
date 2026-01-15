import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { axiosInstance } from "../axios/axios";
import { Loading } from ".";
import { login } from "../features/authentication/authSlice.js";

export function AuthLayout({ children, isAuthRequired = false }) {
  const isLoggedIn = useSelector((state) => state?.auth?.loginStatus);
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const isUserFetched = useRef(false);

  useEffect(() => {
    const logger = async () => {
      setIsLoading(true);
      if (!isLoggedIn) {
        try {
          const response = await axiosInstance.get("/api/v1/user/current-user");
          if (response?.status === 200) {
            dispatch(login({ userData: response?.data }));
            isUserFetched.current = true;
          }
        } catch (error) {
          isUserFetched.current = false;
        }
      }
      setIsLoading(false);
      if (isAuthRequired && !(isLoggedIn || isUserFetched.current)) {
        navigate("/login");
      }
    };
    logger();
  }, [isAuthRequired, isLoggedIn, navigate]);
  return isLoading ? <Loading /> : <>{children}</>;
}
