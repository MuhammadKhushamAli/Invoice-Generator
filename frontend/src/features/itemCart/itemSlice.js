import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  cart: [],
};

const itemSlice = createSlice({
  name: "itemsCart",
  initialState,
  reducers: {
    addItem: (state, action) => {
      const itemToBeAdded = action?.payload?.item;
      const index = state?.cart?.findIndex(
        (item) => item?._id === itemToBeAdded?._id,
      );
      if (index === -1) {
        state?.cart?.push(itemToBeAdded);
      } else {
        if (state.cart[index].price === itemToBeAdded?.price) {
          const incomingQuantity = parseInt(itemToBeAdded?.quantity);
          console.log(incomingQuantity);
          const orignalQuantity = parseInt(state.cart[index].quantity);
          console.log(orignalQuantity);
          state.cart[index].quantity = incomingQuantity + orignalQuantity;
        } else {
          state.cart.push(itemToBeAdded);
        }
      }
    },
    removeItem: (state, action) => {
      const itemToBeRemoved = action?.payload?.item;
      console.log(itemToBeRemoved);
      state.cart = state?.cart?.filter((item) => {
        if (item?._id === itemToBeRemoved?._id)
          if (
            item?.price === itemToBeRemoved?.price &&
            item?.quantity === itemToBeRemoved?.quantity
          )
            return false;
        return true;
      });
    },
    clearCart: (state) => {
      state.cart = [];
    },
  },
});

export const { addItem, removeItem, clearCart } = itemSlice.actions;

export default itemSlice.reducer;
