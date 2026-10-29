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

  const [mostrarPasarela, setMostrarPasarela] = useState(false);
  const [intentoPago, setIntentoPago] = useState(null);
  const [procesandoPago, setProcesandoPago] = useState(false);
  const [nombreTitular, setNombreTitular] = useState("");
  const [emailCliente, setEmailCliente] = useState("");
  const [numeroTarjeta, setNumeroTarjeta] = useState("");
  const [fechaExp, setFechaExp] = useState("");
  const [cvc, setCvc] = useState("");
  const [resultadoPago, setResultadoPago] = useState(null); // { exito: boolean, datos: object, mensajeError: string }

  const [guiaBusqueda, setGuiaBusqueda] = useState("");
  const [infoRastreo, setInfoRastreo] = useState(null);
  const [errorRastreo, setErrorRastreo] = useState("");

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
      return true;
    } catch (error) {
      if (error.response?.data?.problemas) {
        setMensaje("✖ " + error.response.data.problemas.map((p) => p.mensaje).join(", "));
      } else {
        setMensaje("✖ Error de conexión con el servidor");
      }
      return false;
    }
  };

  const iniciarCheckoutStripe = async () => {
    const stockValido = await verificar();
    if (!stockValido) return;

    try {
      const montoFinal = cotizacion ? cotizacion.totalFinal : total;
      const res = await axios.post("http://localhost:5000/api/checkout/crear-intento-pago", {
        items: items.map(({ id, nombre, cantidad, precio }) => ({ id, nombre, cantidad, precio })),
        codigoPostal,
        paqueteria,
        totalFinal: montoFinal,
        emailCliente: emailCliente || "cliente@ecotrend.mx",
      });

      setIntentoPago(res.data);
      setMostrarPasarela(true);
      setResultadoPago(null);
    } catch (error) {
      setMensaje("✖ No se pudo inicializar la pasarela segura de Stripe.");
    }
  };

  const handleFormatoTarjeta = (e) => {
    const valor = e.target.value.replace(/\D/g, "").slice(0, 16);
    const bloques = valor.match(/.{1,4}/g) || [];
    setNumeroTarjeta(bloques.join(" "));
  };

  const handleFormatoFecha = (e) => {
    const valor = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (valor.length >= 3) {
      setFechaExp(`${valor.slice(0, 2)}/${valor.slice(2)}`);
    } else {
      setFechaExp(valor);
    }
  };

  const procesarPagoStripe = async (e) => {
    e.preventDefault();
    const digitosTarjeta = numeroTarjeta.replace(/\s/g, "");

    if (!nombreTitular.trim() || !emailCliente.trim() || digitosTarjeta.length < 16 || fechaExp.length < 5 || cvc.length < 3) {
      setResultadoPago({
        exito: false,
        mensajeError: "Por favor completa correctamente todos los campos de la tarjeta y tu correo electrónico.",
      });
      return;
    }

    setProcesandoPago(true);
    try {
      const ultimos4 = digitosTarjeta.slice(-4);
      const res = await axios.post("http://localhost:5000/api/checkout/confirmar-pago", {
        paymentIntentId: intentoPago.paymentIntentId,
        ultimos4,
        marcaTarjeta: digitosTarjeta.startsWith("4") ? "Visa" : "Mastercard",
        simularFallo: ultimos4 === "0002",
        emailCliente,
      });

      setResultadoPago({
        exito: true,
        datos: res.data.pedido,
      });
      setGuiaBusqueda(res.data.pedido.numeroGuia);
      vaciar();
    } catch (error) {
      const msgError =
        error.response?.data?.error ||
        "Ocurrió un error al procesar el cargo con Stripe. Verifica tu tarjeta e intenta nuevamente.";
      setResultadoPago({
        exito: false,
        mensajeError: msgError,
      });
    } finally {
      setProcesandoPago(false);
    }
  };

  const buscarRastreo = async (e) => {
    if (e) e.preventDefault();
    if (!guiaBusqueda.trim()) return;

    setErrorRastreo("");
    try {
      const res = await axios.get(`http://localhost:5000/api/logistica/rastreo/${guiaBusqueda.trim()}`);
      setInfoRastreo(res.data);
    } catch (error) {
      setInfoRastreo(null);
      setErrorRastreo(error.response?.data?.error || "No se encontró información para esta guía.");
    }
  };

  if (resultadoPago?.exito && resultadoPago.datos) {
    const { idOrden, totalFinal, metodoPago, numeroGuia, emailCliente: correoConfirmado, notificacionCorreo } = resultadoPago.datos;

    return (
      <section className="carrito">
        <div className="carrito__confirmacion-exito" style={{ border: "2px solid #2e7d32", borderRadius: "10px", padding: "24px", backgroundColor: "#f1f8e9" }}>
          <h2 style={{ color: "#2e7d32", marginTop: 0 }}>✔ ¡Pago Confirmado con Éxito!</h2>
          <p>Tu pedido ha sido procesado de forma segura bajo el estándar PCI-DSS mediante <strong>Stripe</strong>.</p>

          <div style={{ background: "#fff", padding: "16px", borderRadius: "8px", margin: "16px 0", border: "1px solid #c8e6c9" }}>
            <p><strong>Orden de compra:</strong> {idOrden}</p>
            <p><strong>Estado en Base de Datos:</strong> <span style={{ color: "#2e7d32", fontWeight: "bold" }}>PAGADO</span></p>
            <p><strong>Monto total cobrado:</strong> ${Number(totalFinal).toFixed(2)} MXN</p>
            <p><strong>Método de pago:</strong> {metodoPago}</p>
            <p><strong>Número de Guía Asignado (ID-08):</strong> <code style={{ background: "#e8f5e9", padding: "4px 8px", fontSize: "1.1rem", fontWeight: "bold" }}>{numeroGuia}</code></p>
            {notificacionCorreo?.enviado && (
              <p style={{ color: "#1b5e20", marginTop: "10px", fontSize: "0.95rem" }}>
                ✉ <strong>Notificación enviada:</strong> Se ha enviado automáticamente el comprobante y la guía de rastreo a <strong>{correoConfirmado}</strong>.
              </p>
            )}
          </div>

          <div style={{ marginTop: "24px", padding: "16px", background: "#ffffff", borderRadius: "8px", border: "1px solid #ddd" }}>
            <h3 style={{ marginTop: 0 }}>📦 Rastreo de Paquete en Tiempo Real (Conexión Logística)</h3>
            <form onSubmit={buscarRastreo} style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
              <input
                type="text"
                value={guiaBusqueda}
                onChange={(e) => setGuiaBusqueda(e.target.value)}
                placeholder="Ingresa tu número de guía"
                style={{ flex: 1, padding: "8px 12px", borderRadius: "6px", border: "1px solid #ccc" }}
              />
              <button type="submit" className="carrito__boton">Consultar avance</button>
            </form>

            {errorRastreo && <p style={{ color: "#c62828" }}>✖ {errorRastreo}</p>}

            {infoRastreo && (
              <div style={{ borderTop: "1px solid #eee", paddingTop: "12px" }}>
                <p><strong>Transportista:</strong> {infoRastreo.paqueteria} | <strong>Destino CP:</strong> {infoRastreo.codigoPostalDestino} | <strong>Estado:</strong> <span style={{ color: "#1565c0", fontWeight: "bold" }}>{infoRastreo.estadoActual}</span></p>
                <ul style={{ listStyle: "none", paddingLeft: 0 }}>
                  {infoRastreo.historial.map((evento, idx) => (
                    <li key={idx} style={{ padding: "8px 0", borderBottom: "1px dashed #e0e0e0" }}>
                      <strong>{evento.estado}</strong> <br />
                      <small style={{ color: "#555" }}>{evento.fecha} — {evento.ubicacion}</small>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div style={{ marginTop: "20px" }}>
            <Link to="/productos" className="carrito__boton">Volver al catálogo</Link>
          </div>
        </div>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="carrito">
        <h2>Tu carrito</h2>
        <p>Tu carrito está vacío.</p>
        <Link to="/productos" className="carrito__boton">Ir al catálogo</Link>

        {/* Rastreador disponible aun con carrito vacío (ID-08) */}
        <div className="carrito__checkout-box" style={{ marginTop: "32px" }}>
          <h3>📦 Rastrear un pedido existente</h3>
          <form onSubmit={buscarRastreo} style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
            <input
              type="text"
              value={guiaBusqueda}
              onChange={(e) => setGuiaBusqueda(e.target.value)}
              placeholder="Ej. EST-MX-123456789"
              style={{ flex: 1, padding: "8px" }}
            />
            <button type="submit" className="carrito__boton">Rastrear</button>
          </form>
          {errorRastreo && <p style={{ color: "#c62828", marginTop: "8px" }}>✖ {errorRastreo}</p>}
          {infoRastreo && (
            <div style={{ marginTop: "12px" }}>
              <p><strong>Orden:</strong> {infoRastreo.idOrden} | <strong>Paquetería:</strong> {infoRastreo.paqueteria}</p>
              <ul>
                {infoRastreo.historial.map((ev, i) => (
                  <li key={i}>{ev.estado} ({ev.ubicacion}) - {ev.fecha}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
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
          <button
            className="carrito__boton"
            style={{ backgroundColor: "#635bff", color: "#fff" }}
            onClick={iniciarCheckoutStripe}
          >
            Pagar con Stripe
          </button>
        </div>
      </div>
      {mensaje && <p className="carrito__mensaje">{mensaje}</p>}

      {/* Bloque ID-06 e ID-07: Pasarela de Pagos Stripe y Manejo de Errores */}
      {mostrarPasarela && intentoPago && (
        <div className="carrito__stripe-box" style={{ marginTop: "24px", padding: "20px", border: "2px solid #635bff", borderRadius: "10px", backgroundColor: "#fafaff" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
            <h3 style={{ margin: 0, color: "#32325d" }}>🔒 Pasarela de Pago Seguro Stripe (PCI-DSS)</h3>
            <small style={{ color: "#6b7c93" }}>Orden: <strong>{intentoPago.idOrden}</strong> | ID: <code>{intentoPago.paymentIntentId}</code></small>
          </div>

          <p style={{ fontSize: "0.9rem", color: "#525f7f", marginTop: "8px" }}>
            Tarjetas de prueba Stripe: Usa <strong>4242 4242 4242 4242</strong> para pago exitoso o <strong>4000 0000 0000 0002</strong> para simular tarjeta declinada.
          </p>

          {/* Pantalla clara de error de pago con opción de reintento (Tarea 7.3) */}
          {resultadoPago && !resultadoPago.exito && (
            <div style={{ backgroundColor: "#ffebee", border: "1px solid #ef5350", color: "#c62828", padding: "12px", borderRadius: "6px", marginBottom: "16px" }}>
              <strong>✖ Error en el pago:</strong> {resultadoPago.mensajeError}
              <div style={{ marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => setResultadoPago(null)}
                  style={{ background: "#c62828", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer" }}
                >
                  Reintentar con otra tarjeta
                </button>
              </div>
            </div>
          )}

          <form onSubmit={procesarPagoStripe} style={{ display: "grid", gap: "12px", marginTop: "12px" }}>
            <label style={{ display: "flex", flexDirection: "column", fontWeight: "600" }}>
              Nombre del titular en la tarjeta:
              <input
                type="text"
                required
                placeholder="Ej. Jesús Bernardo Robles"
                value={nombreTitular}
                onChange={(e) => setNombreTitular(e.target.value)}
                style={{ padding: "10px", borderRadius: "6px", border: "1px solid #ccd0d5", marginTop: "4px" }}
              />
            </label>

            <label style={{ display: "flex", flexDirection: "column", fontWeight: "600" }}>
              Correo electrónico (para recibir confirmación y guía de envío - ID-08):
              <input
                type="email"
                required
                placeholder="cliente@ecotrend.mx"
                value={emailCliente}
                onChange={(e) => setEmailCliente(e.target.value)}
                style={{ padding: "10px", borderRadius: "6px", border: "1px solid #ccd0d5", marginTop: "4px" }}
              />
            </label>

            <label style={{ display: "flex", flexDirection: "column", fontWeight: "600" }}>
              Datos de Tarjeta (Stripe Card Element):
              <input
                type="text"
                required
                placeholder="4242 4242 4242 4242"
                value={numeroTarjeta}
                onChange={handleFormatoTarjeta}
                style={{ padding: "10px", borderRadius: "6px", border: "1px solid #ccd0d5", marginTop: "4px", letterSpacing: "1px" }}
              />
            </label>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <label style={{ display: "flex", flexDirection: "column", fontWeight: "600" }}>
                Vencimiento (MM/AA):
                <input
                  type="text"
                  required
                  placeholder="12/28"
                  value={fechaExp}
                  onChange={handleFormatoFecha}
                  style={{ padding: "10px", borderRadius: "6px", border: "1px solid #ccd0d5", marginTop: "4px" }}
                />
              </label>

              <label style={{ display: "flex", flexDirection: "column", fontWeight: "600" }}>
                CVC:
                <input
                  type="password"
                  required
                  maxLength={4}
                  placeholder="123"
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value.replace(/\D/g, ""))}
                  style={{ padding: "10px", borderRadius: "6px", border: "1px solid #ccd0d5", marginTop: "4px" }}
                />
              </label>
            </div>

            <div style={{ display: "flex", gap: "12px", marginTop: "10px" }}>
              <button
                type="submit"
                disabled={procesandoPago}
                style={{ flex: 1, backgroundColor: "#635bff", color: "#fff", padding: "12px", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" }}
              >
                {procesandoPago
                  ? "Procesando transacción..."
                  : `Confirmar y Pagar $${cotizacion ? cotizacion.totalFinal.toFixed(2) : total} MXN`}
              </button>
              <button
                type="button"
                onClick={() => setMostrarPasarela(false)}
                style={{ padding: "12px 18px", backgroundColor: "#e0e0e0", border: "none", borderRadius: "6px", cursor: "pointer" }}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}

export default Carrito;