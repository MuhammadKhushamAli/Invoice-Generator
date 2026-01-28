import { useDispatch, useSelector } from "react-redux";
import { Button } from "../Button.jsx";
import { Input } from "../Input.jsx";
import { useForm } from "react-hook-form";
import { useCallback, useEffect, useState } from "react";
import { addItem } from "../../features/itemCart/itemSlice.js";
import { Error } from "../Error.jsx";
import { useNavigate } from "react-router";
import {
  DollarSign,
  Package,
  X,
  ShoppingCart,
  Plus,
  Edit2,
} from "lucide-react";
import { AddItem } from "../addItem/AddItem.jsx";

export function ItemCard({ item }) {
  const isLoggedIn = useSelector((state) => state?.auth?.loginStatus);
  const dispatch = useDispatch();
  const [isAddToCart, setIsAddToCart] = useState(false);
  const [remainingCurrentQuantity, setRemainingCurrentQuantity] = useState(0);
  const remainingQuantity = useSelector((state) => {
    const commutativeSum =
      state?.itemsCart?.cart.reduce((commutativeSumOfEach, itemInCart) => {
        if (itemInCart?._id === item?._id) {
          return (
            parseInt(commutativeSumOfEach) + parseInt(itemInCart?.quantity)
          );
        }
        return parseInt(commutativeSumOfEach);
      }, 0) ?? 0;
    return commutativeSum > 0
      ? item?.quantity - commutativeSum
      : item?.quantity;
  });
  const { register, handleSubmit, reset } = useForm();
  const [alert, setAlert] = useState("");
  const navigate = useNavigate();
  const [isEdit, setIsEdit] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
    } else {
      setRemainingCurrentQuantity(remainingQuantity);
    }
  }, [item?.quantity, isLoggedIn, navigate, remainingQuantity]);

  const onSubmit = useCallback(
    (data) => {
      setIsAddToCart(false);
      reset();
      if (isLoggedIn && data?.quantity <= remainingQuantity) {
        const itemToBeAdded = { ...item };
        itemToBeAdded.quantity = data?.quantity;
        itemToBeAdded.price = data?.price;
        dispatch(addItem({ item: itemToBeAdded }));
      } else if (!isLoggedIn) {
        setAlert("Login Required");
      } else {
        setAlert("Desired Quantity is not Available");
      }
    },
    [dispatch, item, isLoggedIn, reset, remainingQuantity],
  );

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/50">
      {/* Error Overlay */}
      {alert && (
        <div className="absolute inset-x-0 top-0 z-20 bg-red-50 px-4 py-2 text-center text-xs font-medium text-red-600">
          <Error message={alert} />
        </div>
      )}

      {/* MODAL OVERLAY: Edit Form */}
      {isEdit && (
        <div className="fixed inset-0 z-60 overflow-y-auto bg-slate-900/20 backdrop-blur-sm">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="w-full max-w-2xl animate-[slideInDown_0.3s_ease-out]">
              <AddItem onClick={() => setIsEdit(false)} item={item} />
            </div>
          </div>
        </div>
      )}

      {/* Edit Button - Positioned Top Right with 'Glass' effect */}
      <div className="absolute top-3 right-3 z-10 transition-opacity duration-200 group-hover:opacity-100">
        <Button
          onClick={() => setIsEdit(true)}
          className="h-9 w-9 rounded-full! bg-white/90! p-0! text-slate-500! shadow-sm backdrop-blur hover:bg-indigo-50! hover:text-indigo-600! flex items-center justify-center! [&_svg]:mr-0!"
          title="Edit Item"
          Icon={Edit2}
        />
      </div>

      {/* Image Section */}
      <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
        <img
          src={item?.image}
          alt={`${item?.name} Picture`}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      {/* Details Section */}
      <div className="flex flex-1 flex-col p-5">
        {/* H2: Styled for hierarchy */}
        <h2
          className="mb-2 truncate text-lg font-bold text-slate-800"
          title={item?.name}
        >
          {item?.name}
        </h2>

        {/* Price & Quantity Info */}
        <div className="mb-4 flex items-center justify-between">
          <p className="flex items-center gap-1 text-lg font-bold text-slate-900">
            <DollarSign className="h-4 w-4 text-indigo-600" />
            {item?.price}
          </p>
          <div className="flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-500">
            <Package className="h-3.5 w-3.5" />
            <span>Qty: {remainingCurrentQuantity}</span>
          </div>
        </div>

        {/* Conditional Form (Animated Fade In) */}
        {isAddToCart && (
          <div className="mb-4 animate-[fadeIn_0.2s_ease-out] overflow-hidden rounded-lg border border-slate-100 bg-slate-50/80 p-3">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              {/* Grid for Quantity and Price Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Qty
                  </label>
                  <Input
                    type="number"
                    placeholder="1"
                    autoFocus
                    min={1}
                    max={remainingQuantity}
                    disabled={remainingQuantity <= 0}
                    className="bg-white h-9 text-sm focus:ring-indigo-500/20 focus:border-indigo-500"
                    {...register("quantity", {
                      required: true,
                      validate: (value) =>
                        (value >= 0 && value <= remainingQuantity) ||
                        "Invalid Quantity",
                      onChange: (e) => {
                        const val = parseInt(e.target.value) || 0;
                        setRemainingCurrentQuantity(remainingQuantity - val);
                      },
                    })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Price
                  </label>
                  <Input
                    type="number"
                    placeholder={item?.price}
                    min={0}
                    disabled={remainingCurrentQuantity < 0}
                    className="bg-white h-9 text-sm focus:ring-indigo-500/20 focus:border-indigo-500"
                    {...register("price", {
                      required: true,
                      validate: (value) => value >= 0 || "Invalid Price",
                    })}
                  />
                </div>
              </div>

              {/* Add Button */}
              <Button
                type="submit"
                Icon={Plus}
                className="h-9 w-full justify-center bg-slate-900 text-xs font-medium text-white shadow-sm hover:bg-slate-800 hover:shadow-md active:scale-95 transition-all"
              >
                Confirm Add
              </Button>
            </form>
          </div>
        )}

        {/* Toggle Action Button */}
        {remainingQuantity > 0 ? (
          <div className="mt-auto pt-2">
            <Button
              onClick={() => setIsAddToCart((prev) => !prev)}
              className={`h-10 w-full justify-center text-sm font-medium transition-colors ${
                isAddToCart
                  ? "border border-red-100 bg-red-600 text-white hover:bg-red-500 hover:border-red-200"
                  : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800"
              }`}
              Icon={isAddToCart ? X : ShoppingCart}
            >
              {isAddToCart ? "Cancel" : "Add to Cart"}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
