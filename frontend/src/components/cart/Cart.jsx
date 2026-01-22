import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { CartItem } from "./CartItem.jsx";
import { Error } from "../Error.jsx";
import { Button } from "../Button.jsx";
import { ShoppingCart, ArrowRight, PackageX, X } from "lucide-react";
import { removeItem } from "../../features/itemCart/itemSlice.js";
import { SaleForm } from "../saleForm/SaleForm.jsx";

export function Cart({ onClick }) {
  const isLoggedIn = useSelector((state) => state?.auth?.loginStatus);

  const cart = useSelector((state) => state?.itemsCart?.cart);
  const dispatch = useDispatch();

  const navigate = useNavigate();

  const [alert, setAlert] = useState("");
  const [isSaleForm, setIsSaleForm] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) navigate("/login");
  }, []);

  const onDelete = useCallback((item) => {
    try {
      cart.filter((cartItem) => cartItem?._id !== item?._id);
      dispatch(removeItem({ item }));
    } catch (error) {
      setAlert("Unable to Delete Cart Item");
    }
  }, []);
  if (isSaleForm) {
    return (
      <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/20 backdrop-blur-sm px-3 sm:px-4 md:px-6 pt-20 sm:pt-20 md:pt-24 lg:pt-28 pb-4 sm:pb-6 md:pb-8 animate-[fadeIn_0.2s_ease-out]">
        <div className="w-full max-w-5xl">
          <SaleForm onClick={() => setIsSaleForm(false)} />
        </div>
      </div>
    );
  } else {
    return cart ? (
      /* ---------------- HAS ITEMS STATE ---------------- */
      /* Main Overlay: Full screen, blurred background */
      <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/20 backdrop-blur-sm transition-all">
        {/* Drawer Container */}
        {/* Added 'relative' so the close button can be positioned absolutely inside */}
        <div className="relative flex h-full w-full flex-col border-l border-slate-200 bg-white shadow-2xl sm:w-112.5 animate-[slideInRight_0.3s_ease-out]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 p-6">
            <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
              <ShoppingCart className="h-5 w-5 text-indigo-600" />
              Your Cart
            </h2>
          </div>

          {/* Close Button (Styled & Positioned Absolute) */}
          {onClick && (
            <div className="absolute right-4 top-4 md:right-8 md:top-8 z-10">
              <Button
                onClick={onClick}
                Icon={X}
                className="h-10 w-10 rounded-full! border border-slate-200! bg-white! p-0! text-slate-400! shadow-sm hover:bg-slate-50! hover:text-slate-700! [&_svg]:mr-0! [&_svg]:h-5! [&_svg]:w-5!"
              />
            </div>
          )}

          {/* Error Toast (Inside drawer) */}
          {alert && <Error message={alert} />}

          {/* Scrollable Item List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cart.map((cartItem) => (
              <CartItem
                key={cartItem?._id}
                item={cartItem}
                onDelete={onDelete}
              />
            ))}
          </div>

          {/* Footer / Submit Action */}
          <div className="border-t border-slate-100 bg-slate-50 p-6">
            <Button
              onClick={() => setIsSaleForm(true)}
              className="w-full justify-between group shadow-indigo-500/20"
              Icon={ArrowRight}
            >
              Proceed to Checkout
            </Button>
          </div>
        </div>
      </div>
    ) : (
      /* ---------------- EMPTY STATE ---------------- */
      <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/20 backdrop-blur-sm">
        <div className="flex h-full w-full flex-col items-center justify-center border-l border-slate-200 bg-white p-6 shadow-2xl sm:w-112.5 animate-[slideInRight_0.3s_ease-out]">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 ring-1 ring-slate-200">
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
}
