import { useCallback, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { NavLink, useNavigate } from "react-router";
import { Button } from "../Button.jsx";
import { LogOut, ShoppingCart, FileCog, Plus } from "lucide-react";
import { Error } from "../Error.jsx";
import { logout } from "../../features/authentication/authSlice.js";
import { Cart } from "../cart/Cart.jsx";
import { axiosInstance } from "../../axios/axios.js";
import { InvoiceCredentials } from "../invoiceCredentials/InvoiceCredentials.jsx";
import { AddItem } from "../addItem/AddItem.jsx";

export function NavBar() {
  const [alert, setAlert] = useState("");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isInvoiceCredOpen, setIsInvoiceCredOpen] = useState(false);
  const [isItemAddOpen, setIsItemAddOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const isLoggedIn = useSelector((state) => state?.auth?.loginStatus);
  const navItems = useMemo(
    () => [
      {
        name: "Home",
        path: "/",
        isVisible: isLoggedIn,
      },
      {
        name: "Sales",
        path: "/sales",
        isVisible: isLoggedIn,
      },
      {
        name: "Products",
        path: "/products",
        isVisible: isLoggedIn,
      },
      {
        name: "Quotation",
        path: "/quotations",
        isVisible: isLoggedIn,
      },
      {
        name: "Delivery Challan",
        path: "/delivery-challans",
        isVisible: isLoggedIn,
      },
      {
        name: "Invoices",
        path: "/invoices",
        isVisible: isLoggedIn,
      },
      {
        name: "Register",
        path: "/register",
        isVisible: !isLoggedIn,
      },
      {
        name: "Login",
        path: "/login",
        isVisible: !isLoggedIn,
      },
    ],
    [isLoggedIn],
  );
  const logOutHandler = useCallback(async () => {
    try {
      const response = await axiosInstance.get("/api/v1/user/logout");
      if (response?.status === 200) {
        setAlert("Logged Out Successfully");
        dispatch(logout());
        navigate("/");
      }
    } catch (error) {
      setAlert(error?.message);
    }
  }, []);

  return (
    <div>
      {alert && (
        <div className="fixed left-0 top-0 z-70 w-full">
          <Error message={alert} />
        </div>
      )}

      {/* Cart Drawer Component */}
      {isCartOpen && <Cart onClick={() => setIsCartOpen(false)} />}

      {/* --- WRAPPER 1: Invoice Credentials Modal --- */}
      {isInvoiceCredOpen && (
        <div className="fixed inset-0 z-60 overflow-y-auto bg-slate-900/20 backdrop-blur-sm">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="w-full max-w-5xl animate-[slideInDown_0.3s_ease-out]">
              <InvoiceCredentials onClick={() => setIsInvoiceCredOpen(false)} />
            </div>
          </div>
        </div>
      )}

      {/* --- WRAPPER 2: Add Item Modal --- */}
      {isItemAddOpen && (
        <div className="fixed inset-0 z-60 overflow-y-auto bg-slate-900/20 backdrop-blur-sm">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="w-full max-w-2xl animate-[slideInDown_0.3s_ease-out]">
              <AddItem onClick={() => setIsItemAddOpen(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Styled NavBar Container */}
      <nav className="fixed left-1/2 top-6 z-40 flex w-[95%] max-w-5xl -translate-x-1/2 items-center justify-between rounded-full border border-slate-200/60 bg-white/80 px-2 py-2 shadow-2xl shadow-slate-200/20 backdrop-blur-xl transition-all">
        {/* Left Section: Cart & Credentials */}
        <div className="flex items-center gap-1 sm:gap-2">
          {isLoggedIn && (
            <div className="shrink-0">
              <Button
                Icon={ShoppingCart}
                onClick={() => setIsCartOpen((prev) => !prev)}
                className={`rounded-full p-3! transition-colors hover:bg-indigo-50! ${
                  isCartOpen
                    ? "bg-indigo-100! text-indigo-600!"
                    : "bg-transparent! text-slate-600!"
                }`}
              >
                <span className="sr-only">Toggle Cart</span>
              </Button>
            </div>
          )}

          {/* Edit Credentials Button */}
          {isLoggedIn && (
            <Button
              Icon={FileCog}
              onClick={() => setIsInvoiceCredOpen(true)}
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-white! p-2! sm:px-3! sm:py-2! text-xs font-medium text-slate-600! shadow-sm transition-colors hover:bg-slate-50! hover:text-slate-900!"
            >
              <span className="hidden sm:inline">Credentials</span>
            </Button>
          )}
        </div>

        {/* Center: Nav Items List */}
        <ul className="flex flex-1 items-center justify-start md:justify-center gap-1 overflow-x-auto px-2 no-scrollbar">
          {navItems.map(
            (item) =>
              item?.isVisible && (
                <li key={item?.name} className="shrink-0">
                  <NavLink
                    to={item?.path}
                    className={({ isActive }) =>
                      `flex items-center gap-2 rounded-full px-3 py-2 sm:px-4 text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? "bg-slate-900 text-white shadow-md shadow-slate-900/20"
                          : "text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-sm"
                      }`
                    }
                  >
                    {item?.name}
                  </NavLink>
                </li>
              ),
          )}
        </ul>

        {/* Right Section: Add Item & Logout */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Add Item Button */}
          {isLoggedIn && (
            <Button
              Icon={Plus}
              onClick={() => setIsItemAddOpen(true)}
              className="flex items-center gap-1 rounded-full bg-indigo-600! p-2! sm:px-4! sm:py-2! text-xs font-bold text-white! shadow-md shadow-indigo-500/20 hover:bg-indigo-700!"
            >
              <span className="hidden sm:inline">Add Item</span>
            </Button>
          )}

          {isLoggedIn && (
            <div className="shrink-0">
              <Button
                Icon={LogOut}
                onClick={logOutHandler}
                type="submit"
                className="rounded-full bg-red-50! p-2.5! sm:px-5! sm:py-2.5! text-sm font-semibold text-red-600! shadow-none hover:bg-red-100! hover:text-red-700!"
              >
                <span className="hidden sm:inline">LogOut</span>
              </Button>
            </div>
          )}
        </div>
      </nav>
    </div>
  );
}
