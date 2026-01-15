import { useDispatch, useSelector } from "react-redux"
import { Button } from "../Button.jsx";
import { Input } from "../Input.jsx";
import { useForm } from "react-hook-form";
import { useCallback, useEffect, useState } from "react";
import { addItem } from "../../features/itemCart/itemSlice.js";
import { Error } from "../Error.jsx";
import { useNavigate } from "react-router";
import { ShoppingCart, X, DollarSign, Package } from "lucide-react";

export function ItemCard({item}){
    const isLoggedIn = useSelector(state => state?.auth?.loginStatus);
    const dispatch = useDispatch();
    const [isAddToCart, setIsAddToCart] = useState(false);
    const {register, handleSubmit} = useForm();
    const [alert, setAlert] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        if(!isLoggedIn)
        {
            navigate("/login");
        }
    })

    const onSubmit = useCallback((data) => {
        if(isLoggedIn && (data?.quantity <= item?.quantity))
        {
            const itemToBeAdded = {...item};
            itemToBeAdded.quantity = data?.quantity;
            item.quantity -= itemToBeAdded?.quantity;
            dispatch(addItem({item: itemToBeAdded}));
        }
        else if (!isLoggedIn)
        {
            setAlert("Login Required");
        }
        else{
            setAlert("Desired Quantity is not Available");
        }
    }, [dispatch])

    return(
<div className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/50">
    
    {/* Error Overlay (if alert exists) */}
    {alert && (
        <div className="bg-red-50 px-4 py-2">
            <Error message={alert}/>
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
                Qty: {item?.quantity}
            </p>
        </div>

        {/* Conditional Form (Appears when Add To Cart is clicked) */}
        {isAddToCart && (
            <div className="mb-4 animate-[fadeIn_0.2s_ease-out]">
                <form onSubmit={handleSubmit(onSubmit)}>
                    <Input
                        type="number"
                        label="Enter Quantity"
                        placeholder="1"
                        autoFocus // UX improvement: Focus input immediately
                        {...register("quantity", { 
                            required: true,
                            validate: (value) => value >= 0 && value <= item?.quantity
                        })}
                    />
                    <p className="mt-1 text-xs text-slate-400">Press Enter to save</p>
                </form>
            </div>
        )}

        {/* Action Button */}
        <div className="mt-auto">
            <Button
                onclick={() => setIsAddToCart((prev) => !prev)}
                className={`w-full ${
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
    )
}