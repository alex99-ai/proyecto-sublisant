import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import "./Carrito.css";

function Carrito() {
  const { items, cambiarCantidad, quitar, vaciar, total } = useCart();
  const [mensaje, setMensaje] = useState("");

  const verificar = async () => {
    try {
      const res = await axios.post("http://localhost:5000/api/carrito/validar", {
        items: items.map(({ id, cantidad }) => ({ id, cantidad })),
      });
      setMensaje("✔ " + res.data.mensaje);
    } catch (error) {
      if (error.response?.data?.problemas) {
        setMensaje("✖ " + error.response.data.problemas.map((p) => p.mensaje).join(", "));
      } else {
        setMensaje("✖ Error de conexión con el servidor");
      }
    }
  };

  if (items.length === 0) {
    return (
      <section className="carrito">
        <h2>Tu carrito</h2>
        <p>Tu carrito está vacío.</p>
        <Link to="/productos" className="carrito__boton">Ir al catálogo</Link>
      </section>
    );
  }

  return (
    <section className="carrito">
      <h2>Tu carrito</h2>
      <ul className="carrito__lista">
        {items.map((item) => (
          <li key={item.id} className="carrito__item">
            <div className="carrito__info">
              <strong>{item.nombre}</strong>
              <small>${item.precio} MXN c/u ({item.stock} disponibles)</small>
            </div>
            <div className="carrito__cantidad">
              <button
                onClick={() => cambiarCantidad(item.id, item.cantidad - 1)}
                disabled={item.cantidad <= 1}
                aria-label="Quitar uno"
              >-</button>
              <span>{item.cantidad}</span>
              <button
                onClick={() => cambiarCantidad(item.id, item.cantidad + 1)}
                disabled={item.cantidad >= item.stock}
                aria-label="Agregar uno"
              >+</button>
            </div>
            <span className="carrito__subtotal">${item.precio * item.cantidad} MXN</span>
            <button className="carrito__quitar" onClick={() => quitar(item.id)}>Eliminar</button>
          </li>
        ))}
      </ul>
      <div className="carrito__resumen">
        <strong>Total: ${total} MXN</strong>
        <div className="carrito__acciones">
          <button onClick={vaciar}>Vaciar carrito</button>
          <button className="carrito__boton" onClick={verificar}>Verificar disponibilidad</button>
        </div>
      </div>
      {mensaje && <p className="carrito__mensaje">{mensaje}</p>}
    </section>
  );
}

export default Carrito;