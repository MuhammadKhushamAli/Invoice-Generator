import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { Provider } from "react-redux";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { store } from "./app/store.js";
import { AuthLayout } from "./components/AuthLayout.jsx";
import {
  HomePage,
  InvoicePage,
  LoginPage,
  RegisterPage,
  ItemPage,
  SalesPage,
  InvoiceViewPage,
} from "./pages";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: (
          <AuthLayout isAuthRequired={false}>
            <HomePage />
          </AuthLayout>
        ),
      },
      {
        path: "/login",
        element: (
          <AuthLayout isAuthRequired={false}>
            <LoginPage />
          </AuthLayout>
        ),
      },
      {
        path: "/register",
        element: (
          <AuthLayout isAuthRequired={false}>
            <RegisterPage />
          </AuthLayout>
        ),
      },
      {
        path: "/invoices",
        element: (
          <AuthLayout isAuthRequired={true}>
            <InvoicePage />
          </AuthLayout>
        ),
      },
      {
        path: "/products",
        element: (
          <AuthLayout isAuthRequired={true}>
            <ItemPage />
          </AuthLayout>
        ),
      },
      {
        path: "/sales",
        element: (
          <AuthLayout isAuthRequired={true}>
            <SalesPage />
          </AuthLayout>
        ),
      },
      {
        path: "/invoice/:invoiceId",
        element: (
          <AuthLayout isAuthRequired={true}>
            <InvoiceViewPage />
          </AuthLayout>
        ),
      },
    ],
  },
]);

const queryClient = new QueryClient();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </Provider>
  </StrictMode>,
);
