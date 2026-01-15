import { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { NavLink, useNavigate } from "react-router";
import { Button } from "../Button.jsx";
import { LogOut, ShoppingCart, LayoutGrid } from "lucide-react";
import { Error } from "../Error.jsx";
import { useState } from "react";
import { logout } from "../../features/authentication/authSlice.js";
import { Cart } from "../cart/Cart.jsx";

export function NavBar() {
  const [alert, setAlert] = useState("");
  const [isCartOpen, setIsCartOpen] = useState(false);
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
        name: "Invoices",
        path: "/invoices",
        isVisible: isLoggedIn,
      },
      {
        name: "Register",
        path: "/register",
        isVisible: isLoggedIn,
      },
      {
        name: "Login",
        path: "/login",
        isVisible: !isLoggedIn,
      },
    ],
    [isLoggedIn]
  );

  const logOut = async () => {
    try {
      const response = await axiosInstance.get("/api/v1/user/logout");
      if (response?.status === 200) {
        setAlert("Logged Out Successfully");
        dispatch(logout());
        navigate("/");
      }
    } catch (error) {
      setAlert(response?.message);
    }
  };

  return (
    <div>
      {/* The Error Component */}
      {alert && (
        <div className="fixed left-1/2 top-4 z-60 -translate-x-1/2">
          <Error message={alert} />
        </div>
      )}

      {/* Cart Drawer Component (Z-Index 50 defined in previous step) */}
      {isCartOpen && <Cart />}

      {/* Styled NavBar Container: Glassy, Floating, Rounded */}
      <NavBar className="fixed left-1/2 top-6 z-40 flex w-[95%] max-w-5xl -translate-x-1/2 items-center justify-between rounded-full border border-slate-200/60 bg-white/80 px-2 py-2 shadow-2xl shadow-slate-200/20 backdrop-blur-xl transition-all">
        {/* Left: Cart Trigger Button */}
        <div className="shrink-0">
          <Button
            onclick={() => setIsCartOpen((prev) => !prev)}
            className={`rounded-full p-3! transition-colors hover:bg-indigo-50! ${
              isCartOpen
                ? "bg-indigo-100! text-indigo-600!"
                : "bg-transparent! text-slate-600!"
            }`}
            // Using children to render the icon cleanly if your Button supports it, or use Icon prop
          >
            <ShoppingCart className="h-5 w-5" />
            <span className="sr-only">Toggle Cart</span>
          </Button>
        </div>

        {/* Center: Nav Items List */}
        <ul className="flex flex-1 items-center justify-center gap-1 overflow-x-auto px-4 no-scrollbar">
          {navItems.map((item) => (
            <li key={item?.name} className="shrink-0">
              <NavLink
                to={item?.path}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-slate-900 text-white shadow-md shadow-slate-900/20"
                      : "text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-sm"
                  }`
                }
              >
                {/* Optional: You can render specific icons based on item name here if available */}
                {item?.name}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Right: Logout Button */}
        <div className="shrink-0">
          <Button
            Icon={LogOut}
            onClick={logOut} // Keeping your provided onClick logic
            type="submit"
            className="rounded-full bg-red-50! px-5! py-2.5! text-sm font-semibold text-red-600! shadow-none hover:bg-red-100! hover:text-red-700!"
          >
            LogOut
          </Button>
        </div>
      </NavBar>
    </div>
  );
}
