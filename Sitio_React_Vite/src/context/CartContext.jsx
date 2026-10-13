import { createContext, useContext, useState } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  const agregar = (producto) => {
    setItems((prev) => {
      const existente = prev.find((i) => i.id === producto.id);
      if (existente) {
        if (existente.cantidad >= producto.stock) return prev;
        return prev.map((i) =>
          i.id === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i
        );
      }
      if (producto.stock < 1) return prev;
      return [
        ...prev,
        {
          id: producto.id,
          nombre: producto.nombre,
          precio: producto.precio,
          stock: producto.stock,
          cantidad: 1,
        },
      ];
    });
  };

  const quitar = (id) => setItems((prev) => prev.filter((i) => i.id !== id));

  const cambiarCantidad = (id, cantidad) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === id
          ? { ...i, cantidad: Math.max(1, Math.min(cantidad, i.stock)) }
          : i
      )
    );
  };

  const vaciar = () => setItems([]);

  const total = items.reduce((suma, i) => suma + i.precio * i.cantidad, 0);
  const totalArticulos = items.reduce((suma, i) => suma + i.cantidad, 0);

  return (
    <CartContext.Provider
      value={{ items, agregar, quitar, cambiarCantidad, vaciar, total, totalArticulos }}
    >
      {children}
    </CartContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  return useContext(CartContext);
}