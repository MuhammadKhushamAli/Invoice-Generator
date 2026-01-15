import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    cart: []
};

const itemSlice = createSlice({
    name: "itemsCart",
    initialState,
    reducers: {
        addItem: (state, action) => {
            const itemToBeAdded = action?.payload?.item;
            const index = state?.cart?.findIndex(item => item?._id === itemToBeAdded?._id);
            if(index === -1)
            {
                state?.cart?.push(itemToBeAdded);
            }
            else{
                state.cart[index].quantity += itemToBeAdded?.quantity
            }
        },
        removeItem: (state, action) => {
            const itemToBeAdded = action?.payload?.item;
            state.cart = state?.cart?.filter(item => item?._id !== itemToBeAdded?._id);
        },
        clearCart: (state) => {
            state.cart = [];
        }
    }
})

export const { addItem, removeItem, clearCart } = itemSlice.actions;

export default itemSlice.reducer;
