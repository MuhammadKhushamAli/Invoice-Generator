import { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { NavLink, useNavigate } from "react-router";
import { Button } from "../Button.jsx";
import { LogOut } from "lucide-react";
import { Error } from "../Error.jsx";
import { useState } from "react";
import { logout } from "../../features/authentication/authSlice.js";

export function NavBar() {
  const [alert, setAlert] = useState("");
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
      {/* The Error Component stays exactly as it was */}
      {alert && <Error message={alert} />}

      {/* Styled NavBar Container: Glassy, Floating, Rounded */}
      <NavBar className="fixed left-1/2 top-6 z-40 flex w-[95%] max-w-6xl -translate-x-1/2 items-center justify-between rounded-full border border-white/40 bg-white/70 px-4 py-2 shadow-xl shadow-slate-200/40 backdrop-blur-xl transition-all md:px-6">
        {/* Nav Items List: Flex-1 ensures it takes up space to center the items */}
        <ul className="flex flex-1 items-center justify-center gap-1 overflow-x-auto px-2 md:gap-2 no-scrollbar">
          {navItems.map((item) => (
            <li key={item?.name} className="shrink-0">
              <NavLink
                to={item?.path}
                className={({ isActive }) =>
                  `block rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                      : "text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm"
                  }`
                }
              >
                {item?.name}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Logout Button: Pushed to the right, styled with your Button component */}
        <div className="shrink-0 pl-2">
          <Button
            Icon={LogOut}
            onClick={logOut}
            type="submit"
            className="rounded-full px-5! py-2! bg-slate-800 hover:bg-slate-900 shadow-md"
          >
            LogOut
          </Button>
        </div>
      </NavBar>
    </div>
  );
}
