import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { Loading } from "../Loading.jsx";
import { CartItem } from "./CartItem.jsx";
import { useCallback } from "react";
import { Error } from "../Error.jsx";
import { Button } from "../Button.jsx";
import { ShoppingCart, ArrowRight, PackageX } from "lucide-react";
import { removeItem } from "../../features/itemCart/itemSlice.js";

export function Cart() {
  const isLoggedIn = useSelector((state) => state?.auth?.loginStatus);

  const cart = useSelector((state) => state?.itemsCart?.cart);
  const dispatch = useDispatch();

  const navigate = useNavigate();

  const [alert, setAlert] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    if (!isLoggedIn) navigate("/login");
    setIsLoading(false);
  }, []);

  const onDelete = useCallback((item) => {
    try {
      cart.splice(cart.indexOf(item), 1);
      dispatch(removeItem({ item }));
    } catch (error) {
      setAlert("Unable to Delete Cart Item");
    }
  }, []);

  return isLoading ? (
    <Loading />
  ) : cart ? (
    /* ---------------- HAS ITEMS STATE ---------------- */
    /* Main Overlay: Full screen, blurred background */
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/20 backdrop-blur-sm transition-all">
      {/* Drawer Container: Slides in from right, covers ~30% */}
      <div className="flex h-full w-full flex-col border-l border-slate-200 bg-white shadow-2xl sm:w-100 md:w-[30%] animate-[slideInRight_0.3s_ease-out]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-6">
          <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <ShoppingCart className="h-5 w-5 text-indigo-600" />
            Your Cart
          </h2>
          {/* Optional: You could add a close button here if you had a close handler */}
        </div>

        {/* Error Toast (Inside drawer) */}
        {alert && <Error message={alert} />}

        {/* Scrollable Item List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {cart.map((cartItem) => (
            <CartItem key={cartItem?._id} item={cartItem} onDelete={onDelete} />
          ))}
        </div>

        {/* Footer / Submit Action */}
        <div className="border-t border-slate-100 bg-slate-50 p-6">
          <Button
            onclick={() => navigate("/sale-form")}
            className="w-full justify-between group"
            Icon={
              ArrowRight
            } /* Icon appears on left by default in your button */
          >
            Proceed to Checkout
          </Button>
        </div>
      </div>
    </div>
  ) : (
    /* ---------------- EMPTY STATE ---------------- */
    /* Same Drawer structure, but for empty state */
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/20 backdrop-blur-sm">
      <div className="flex h-full w-full flex-col items-center justify-center border-l border-slate-200 bg-white p-6 shadow-2xl sm:w-100 md:w-[30%] animate-[slideInRight_0.3s_ease-out]">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
          <PackageX className="h-10 w-10 text-slate-400" />
        </div>
        <h5 className="mt-4 text-lg font-semibold text-slate-900">
          No Cart Items Found
        </h5>
        <p className="mt-2 text-center text-sm text-slate-500">
          It looks like you haven't added anything to your cart yet.
        </p>
      </div>
    </div>
  );
}
