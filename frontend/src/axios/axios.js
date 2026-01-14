import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
  timeout: 5000000,
});

axiosInstance.interceptors.request.use(
  (res) => ({
    data: res?.data?.data,
    message: res?.data?.message || "Success",
    statusCode: res?.status,
  }),
  async (error) => {
    const originalRequest = error?.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        await axiosInstance.get("/api/v1/user/refresh-tokens");
        return axiosInstance(originalRequest);
      } catch (error) {
        window.location.href = "/login";
        return Promise.reject({
          status: error?.status,
          message: error?.response?.data?.message || "Unauthorized Access",
          data: [],
        });
      }
    }
    return Promise.reject({
      status: error?.status,
      message: error?.response?.data?.message || "Internal Server Error",
      data: [],
    });
  }
);
