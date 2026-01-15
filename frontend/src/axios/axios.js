import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
  timeout: 50000000,
});

axiosInstance.interceptors.response.use(
  (res) => ({
    data: res?.data?.data,
    message: res?.data?.message || "Succeed",
    status: res?.status,
  }),
  async (error) => {
    console.log(error);
    const orignalRequest = error.config;
    if (error.response?.status === 401 && !orignalRequest._retry) {
      orignalRequest._retry = true;
      try {
        await axiosInstance.get("/api/v1/user/refresh-tokens");
        return axiosInstance(orignalRequest);
      } catch (error) {
        window.location.href = "/login";
        return Promise.reject({
          status: error?.status,
          message: error?.response?.data?.message || "Something Went Wrong",
          data: [],
        });
      }
    } else if (error.name === "CanceledError") {
      return Promise.reject(error);
    }
    return Promise.reject({
      status: error?.status,
      message: error?.response?.data?.message || "Something Went Wrong",
      data: [],
    });
  }
);