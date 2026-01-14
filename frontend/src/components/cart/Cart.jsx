import { useState } from "react";
import { useSelector } from "react-redux";

export function Cart() {

    const isLoggedIn = useSelector((state) => state?.auth?.loginStatus);

    const cart = useSelector((state) => state?.itemsCart?.cart);

  const [alert, setAlert] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(())
}
