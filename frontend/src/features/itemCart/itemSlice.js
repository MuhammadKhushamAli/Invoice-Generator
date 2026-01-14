import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    cart: []
};

const itemSlice = createSlice({
    name: "itemsCart",
    initialState,
    reducers: {
        addItem: (state, action) => {
            const index = state.cart.indexOf(action?.payload?.item);
            if (index !== -1)
                state.cart[index].quantity += action?.payload?.item?.quantity;
            else
                state.cart.push(action?.payload?.item);
        },
        removeItem: (state, action) => {
            const index = state.action.payload?.item;
            if(index !== -1)
                state.cart?.splice(index, 1);
        },
        clearCart: (state) => {
            state.cart = [];
        }
    }
})

export const { addItem, removeItem, clearCart } = itemSlice.actions;

export default itemSlice.reducer;
