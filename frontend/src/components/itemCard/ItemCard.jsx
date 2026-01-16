import { useDispatch, useSelector } from "react-redux";
import { Button } from "../Button.jsx";
import { Input } from "../Input.jsx";
import { useForm } from "react-hook-form";
import { useCallback, useEffect, useState } from "react";
import { addItem } from "../../features/itemCart/itemSlice.js";
import { Error } from "../Error.jsx";
import { useNavigate } from "react-router";
import { DollarSign, Package, X, ShoppingCart, Plus } from "lucide-react";

export function ItemCard({ item }) {
  const isLoggedIn = useSelector((state) => state?.auth?.loginStatus);
  const dispatch = useDispatch();
  const [isAddToCart, setIsAddToCart] = useState(false);
  const [quantity, setQuantity] = useState(0);
  const { register, handleSubmit, reset } = useForm();
  const [alert, setAlert] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
    } else {
      setQuantity(item?.quantity);
    }
  }, []);

  const onSubmit = useCallback(
    (data) => {
      setIsAddToCart(false);
      reset();
      if (isLoggedIn && data?.quantity <= item?.quantity) {
        const itemToBeAdded = { ...item };
        itemToBeAdded.quantity = data?.quantity;
        itemToBeAdded.price = data?.price;
        let itemToBeAddedQuantity = parseInt(data?.quantity);
        let orignalItemsQuantity = parseInt(item?.quantity);
        orignalItemsQuantity -= itemToBeAddedQuantity;
        item.quantity = orignalItemsQuantity;
        dispatch(addItem({ item: itemToBeAdded }));
      } else if (!isLoggedIn) {
        setAlert("Login Required");
      } else {
        setAlert("Desired Quantity is not Available");
      }
    },
    [dispatch]
  );

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/50">
      {/* Error Overlay */}
      {alert && (
        <div className="bg-red-50 px-4 py-2 text-sm text-red-600">
          <Error message={alert} />
        </div>
      )}

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
        {/* Price & Quantity Info */}
        <div className="mb-4 flex items-center justify-between">
          <p className="flex items-center gap-1 text-lg font-bold text-slate-900">
            <DollarSign className="h-4 w-4 text-indigo-600" />
            {item?.price}
          </p>
          <p className="flex items-center gap-1 text-sm font-medium text-slate-500">
            <Package className="h-4 w-4" />
            Qty: {quantity}
          </p>
        </div>

        {/* Conditional Form (Animated Fade In) */}
        {isAddToCart && (
          <div className="mb-4 animate-[fadeIn_0.2s_ease-out] rounded-lg border border-slate-100 bg-slate-50/50 p-3">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              {/* Grid for Quantity and Price Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="number"
                  label="Qty"
                  placeholder="1"
                  autoFocus
                  min={0}
                  max={item?.quantity}
                  className="bg-white" // Override default input bg for better contrast
                  {...register("quantity", {
                    required: true,
                    validate: (value) =>
                      (value >= 0 && value <= item?.quantity) || "Invalid",
                    onChange: (e) => {
                      // Logic preserved exactly as requested
                      const val = parseInt(e.target.value) || 0;
                      let remaining = item?.quantity - val;
                      if (remaining < 0) remaining = 0;
                      // Note: You used 'quantity' state variable in your original code logic
                      // make sure 'quantity' here refers to the state you want to update visually
                      setQuantity(remaining);
                    },
                  })}
                />
                <Input
                  type="number"
                  label="Price"
                  placeholder={item?.price}
                  min={0}
                  disabled={quantity < 0}
                  className="bg-white"
                  {...register("price", {
                    required: true,
                    validate: (value) => value >= 0 || "Invalid",
                  })}
                />
              </div>

              {/* Add Button */}
              <Button
                type="submit"
                Icon={Plus}
                className="w-full justify-center bg-slate-900! text-white! hover:bg-slate-800! shadow-none h-9 text-xs"
              >
                Confirm Add
              </Button>
            </form>
          </div>
        )}

        {/* Toggle Action Button */}
        <div className="mt-auto">
          <Button
            onClick={() => setIsAddToCart((prev) => !prev)}
            className={`w-full justify-center ${
              isAddToCart
                ? "bg-white! border border-red-200 text-red-600! shadow-none hover:bg-red-50!" // Cancel Style
                : "hover:shadow-indigo-500/20" // Default Add Style
            }`}
            Icon={isAddToCart ? X : ShoppingCart}
          >
            {isAddToCart ? "Cancel" : "Add to Cart"}
          </Button>
        </div>
      </div>
    </div>
  );
}
