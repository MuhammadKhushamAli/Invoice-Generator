import { Button } from "../Button";

export function CartItem({ item, onDelete }) {
  return (
    <div>
      <img src={item?.image} alt={`${item?.name} Picture`} />
      <h3>{item?.name}</h3>
      <h5>Price: {item?.price}</h5>
      <h6>Quantity: {item?.quantity}</h6>
      <Button onclick={() => onDelete(item?._id)}>Delete</Button>
    </div>
  );
}
