import { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import "./Carrito.css";

function Carrito() {
  const { items, cambiarCantidad, quitar, vaciar, total } = useCart();
  const [mensaje, setMensaje] = useState("");


  const [codigoPostal, setCodigoPostal] = useState("45650");
  const [paqueteria, setPaqueteria] = useState("estandar");
  const [cotizacion, setCotizacion] = useState(null);


  useEffect(() => {
    if (items.length === 0) {
      setCotizacion(null);
      return;
    }

    const calcularCostos = async () => {
      try {
        const res = await axios.post("http://localhost:5000/api/checkout/calcular-costos", {
          items: items.map(({ id, cantidad, precio }) => ({ id, cantidad, precio })),
          codigoPostal,
          paqueteria,
        });
        setCotizacion(res.data);
      } catch (error) {
        console.error("Error al cotizar envío e IVA:", error);
      }
    };

    calcularCostos();
  }, [items, codigoPostal, paqueteria]);

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

      {/* Bloque ID-05: Resumen de Orden en Tiempo Real (Checkout) */}
      <div className="carrito__checkout-box">
        <h3>Resumen de Orden y Cotización de Envío</h3>

        <div className="carrito__envio-form">
          <label>
            Código Postal:
            <input
              type="text"
              maxLength={5}
              value={codigoPostal}
              onChange={(e) => setCodigoPostal(e.target.value.replace(/\D/g, ""))}
              placeholder="Ej. 45650"
            />
          </label>

          <label>
            Paquetería:
            <select value={paqueteria} onChange={(e) => setPaqueteria(e.target.value)}>
              <option value="estandar">Estafeta Estándar</option>
              <option value="fedex">FedEx Nacional (2-3 días)</option>
              <option value="express">DHL Express (24 hrs)</option>
            </select>
          </label>
        </div>

        {cotizacion && (
          <div className="carrito__desglose">
            <p><span>Región:</span> <strong>{cotizacion.region}</strong></p>
            <p><span>Entrega estimada:</span> <strong>{cotizacion.nombrePaqueteria} ({cotizacion.tiempoEstimado})</strong></p>
            <p><span>Peso total del paquete:</span> <span>{cotizacion.pesoTotalKg} kg</span></p>
            <hr />
            <p><span>Subtotal:</span> <span>${cotizacion.subtotal.toFixed(2)} MXN</span></p>
            <p><span>IVA (16%):</span> <span>${cotizacion.iva.toFixed(2)} MXN</span></p>
            <p>
              <span>Costo de envío:</span>{" "}
              <span>
                {cotizacion.envioGratis ? (
                  <strong style={{ color: "#2e7d32" }}>¡GRATIS! (Compra mayor a $1,200)</strong>
                ) : (
                  `$${cotizacion.costoEnvio.toFixed(2)} MXN`
                )}
              </span>
            </p>
          </div>
        )}
      </div>

      <div className="carrito__resumen">
        <div>
          <small style={{ display: "block", color: "#555" }}>Subtotal productos: ${total} MXN</small>
          <strong>
            Total Final (con IVA y Envío): ${cotizacion ? cotizacion.totalFinal.toFixed(2) : total} MXN
          </strong>
        </div>
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