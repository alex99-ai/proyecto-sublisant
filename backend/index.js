require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');

const STRIPE_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_51MockEcoTrendKey';
const stripe = require('stripe')(STRIPE_KEY);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
const productos = require('./data/productos.json');

app.get('/api/productos', (req, res) => {
  res.json(productos);
});

app.post('/api/carrito/validar', (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items)) {
    return res.status(400).json({ error: "El carrito debe ser una lista de productos" });
  }

  const problemas = [];
  for (const item of items) {
    const producto = productos.find(p => p.id === item.id);
    if (!producto) {
      problemas.push({ id: item.id, mensaje: "Un producto del carrito ya no existe" });
    } else if (!Number.isInteger(item.cantidad) || item.cantidad < 1) {
      problemas.push({ id: item.id, mensaje: `Cantidad no válida para ${producto.nombre}` });
    } else if (item.cantidad > producto.stock) {
      problemas.push({
        id: item.id,
        mensaje: `Solo hay ${producto.stock} disponibles de ${producto.nombre}`,
        disponible: producto.stock
      });
    }
  }

  if (problemas.length > 0) {
    return res.status(409).json({ ok: false, problemas });
  }

  res.json({ ok: true, mensaje: "Todo el carrito está disponible" });
});

const usuariosDB = [];

app.post('/api/registro', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const nuevoUsuario = {
      id: usuariosDB.length + 1,
      email: email,
      password: hashedPassword
    };

    usuariosDB.push(nuevoUsuario);
    console.log("Usuario registrado con éxito:", nuevoUsuario);

    res.status(201).json({ mensaje: "Usuario registrado exitosamente" });

  } catch (error) {
    res.status(500).json({ error: "Error en el servidor al registrar" });
  }
});

async function loginUsuario(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }

    const usuario = usuariosDB.find(u => u.email === email);

    if (!usuario) {
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    const contrasenaValida = await bcrypt.compare(password, usuario.password);

    if (!contrasenaValida) {
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    return res.status(200).json({ message: "Login correcto" });
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    return res.status(500).json({ error: "Error en el servidor al iniciar sesión" });
  }
}
app.post('/api/login', loginUsuario);

const TASA_IVA = 0.16;

const ZONAS_ENVIO = {
  LOCAL: {
    nombre: "Zona Metropolitana / Occidente (Jalisco)",
    tarifaBase: 85,
    costoKgExtra: 15,
    diasEstandar: "1 a 2 días hábiles"
  },
  CENTRO: {
    nombre: "Zona Centro / Bajío",
    tarifaBase: 120,
    costoKgExtra: 22,
    diasEstandar: "2 a 4 días hábiles"
  },
  EXTENDIDA: {
    nombre: "Zona Norte / Sur / Frontera",
    tarifaBase: 160,
    costoKgExtra: 30,
    diasEstandar: "3 a 6 días hábiles"
  }
};

function obtenerZonaPorCP(cp = "") {
  const prefijo = parseInt(String(cp).substring(0, 2), 10);
  if (isNaN(prefijo)) return ZONAS_ENVIO.CENTRO;
  if (prefijo >= 44 && prefijo <= 49) return ZONAS_ENVIO.LOCAL;
  if ((prefijo >= 1 && prefijo <= 38) || (prefijo >= 50 && prefijo <= 62)) {
    return ZONAS_ENVIO.CENTRO;
  }
  return ZONAS_ENVIO.EXTENDIDA;
}

app.post('/api/checkout/calcular-costos', (req, res) => {
  try {
    const { items = [], codigoPostal = "45650", paqueteria = "estandar" } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "El carrito está vacío" });
    }

    let subtotal = 0;
    let pesoTotalKg = 0;

    for (const item of items) {
      const prodBD = productos.find(p => p.id === item.id);
      const precio = prodBD ? Number(prodBD.precio) : Number(item.precio) || 0;
      const cantidad = Number(item.cantidad) || 1;
      const pesoUnitario = (prodBD && prodBD.pesoKg) ? Number(prodBD.pesoKg) : 0.35;

      subtotal += precio * cantidad;
      pesoTotalKg += pesoUnitario * cantidad;
    }

    const iva = +(subtotal * TASA_IVA).toFixed(2);
    const zona = obtenerZonaPorCP(codigoPostal);
    const kilosExtra = Math.max(0, Math.ceil(pesoTotalKg - 1));
    let costoEnvio = zona.tarifaBase + (kilosExtra * zona.costoKgExtra);

    let nombrePaqueteria = "Estafeta Estándar";
    let tiempoEstimado = zona.diasEstandar;

    if (paqueteria === "express") {
      costoEnvio += 65;
      nombrePaqueteria = "DHL Express";
      tiempoEstimado = "24 horas hábiles";
    } else if (paqueteria === "fedex") {
      costoEnvio += 25;
      nombrePaqueteria = "FedEx Nacional";
      tiempoEstimado = "2 a 3 días hábiles";
    }

    const envioGratis = subtotal >= 1200 && paqueteria === "estandar";
    if (envioGratis) {
      costoEnvio = 0;
    }

    const totalFinal = +(subtotal + iva + costoEnvio).toFixed(2);

    return res.json({
      subtotal: +subtotal.toFixed(2),
      iva,
      pesoTotalKg: +pesoTotalKg.toFixed(2),
      costoEnvio: +costoEnvio.toFixed(2),
      envioGratis,
      totalFinal,
      region: zona.nombre,
      nombrePaqueteria,
      tiempoEstimado
    });
  } catch (error) {
    console.error("Error al calcular costos:", error);
    return res.status(500).json({ error: "Error en el motor de costos" });
  }
});


const pedidosDB = [];

// Función auxiliar Tarea 8.1: Generador de guía según paquetería
function generarGuiaEnvio(paqueteria = "estandar") {
  const prefijos = {
    estandar: "EST-MX",
    fedex: "FDX-NAC",
    express: "DHL-EXP"
  };
  const prefijo = prefijos[paqueteria] || "ECO-ENV";
  const randomNum = Math.floor(100000000 + Math.random() * 900000000);
  return `${prefijo}-${randomNum}`;
}

app.post('/api/checkout/crear-intento-pago', async (req, res) => {
  try {
    const { items = [], codigoPostal = "45650", paqueteria = "estandar", totalFinal, emailCliente } = req.body;

    if (!totalFinal || totalFinal <= 0) {
      return res.status(400).json({ error: "El monto total a cobrar no es válido" });
    }

    const montoCentavos = Math.round(Number(totalFinal) * 100);
    let clientSecret = `pi_sandbox_${Date.now()}_secret_${Math.random().toString(36).substring(2, 8)}`;
    let paymentIntentId = `pi_${Date.now()}`;

    if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.startsWith('sk_test_') && !process.env.STRIPE_SECRET_KEY.includes('Mock')) {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: montoCentavos,
        currency: 'mxn',
        payment_method_types: ['card'],
        metadata: { codigoPostal, paqueteria, emailCliente: emailCliente || "cliente@ecotrend.mx" }
      });
      clientSecret = paymentIntent.client_secret;
      paymentIntentId = paymentIntent.id;
    }

    const nuevoPedido = {
      idOrden: `ORD-${pedidosDB.length + 1001}`,
      paymentIntentId,
      items,
      codigoPostal,
      paqueteria,
      totalFinal: Number(totalFinal),
      emailCliente: emailCliente || "cliente@ecotrend.mx",
      estadoPago: "Pendiente",
      numeroGuia: null,
      historialTracking: [],
      fechaCreacion: new Date().toISOString()
    };

    pedidosDB.push(nuevoPedido);

    return res.status(200).json({
      clientSecret,
      paymentIntentId,
      idOrden: nuevoPedido.idOrden
    });
  } catch (error) {
    console.error("Error al crear PaymentIntent:", error);
    return res.status(500).json({ error: "No se pudo iniciar la transacción con Stripe" });
  }
});

app.post('/api/checkout/confirmar-pago', (req, res) => {
  try {
    const { paymentIntentId, ultimos4, marcaTarjeta = "Visa", simularFallo = false, emailCliente } = req.body;

    const pedido = pedidosDB.find(p => p.paymentIntentId === paymentIntentId);
    if (!pedido) {
      return res.status(404).json({ error: "No se encontró la orden asociada al intento de pago" });
    }

    if (pedido.estadoPago === "Pagado") {
      return res.status(409).json({
        error: "Este pedido ya fue cobrado previamente. Se bloqueó el cargo duplicado.",
        pedido
      });
    }

    if (simularFallo || ultimos4 === "0002") {
      pedido.estadoPago = "Fallido";
      return res.status(402).json({
        ok: false,
        estadoPago: "Fallido",
        error: "Transacción declinada por el banco emisor (Fondos insuficientes o tarjeta rechazada)."
      });
    }

    pedido.estadoPago = "Pagado";
    pedido.metodoPago = `${marcaTarjeta} terminación **** ${ultimos4 || "4242"}`;
    pedido.fechaPago = new Date().toISOString();
    if (emailCliente) pedido.emailCliente = emailCliente;

    for (const item of pedido.items) {
      const prod = productos.find(p => p.id === item.id);
      if (prod && prod.stock >= item.cantidad) {
        prod.stock -= item.cantidad;
      }
    }

    const guia = generarGuiaEnvio(pedido.paqueteria);
    pedido.numeroGuia = guia;
    pedido.historialTracking = [
      { fecha: new Date().toLocaleString('es-MX'), estado: "Pago confirmado y orden recibida en almacén EcoTrend", ubicacion: "Guadalajara, JAL" },
      { fecha: new Date().toLocaleString('es-MX'), estado: "Guía generada y paquete recolectado por transportista", ubicacion: "Centro de Distribución Occidente" },
      { fecha: "En curso", estado: `En tránsito hacia CP ${pedido.codigoPostal}`, ubicacion: "Ruta Nacional" }
    ];

    const notificacionCorreo = {
      destinatario: pedido.emailCliente,
      asunto: `Confirmación de compra ${pedido.idOrden} y Guía de Rastreo ${guia}`,
      mensaje: `Hola, tu pago por $${pedido.totalFinal.toFixed(2)} MXN fue exitoso. Rastrea tu paquete sustentable con la guía: ${guia}`,
      enviado: true,
      timestamp: new Date().toISOString()
    };
    pedido.notificacionCorreo = notificacionCorreo;

    console.log(`[STRIPE WEBHOOK / PAGO EXITOSO] Orden: ${pedido.idOrden} | Estado: Pagado | Guía: ${guia} | Correo enviado a: ${pedido.emailCliente}`);

    return res.status(200).json({
      ok: true,
      mensaje: "Pago confirmado exitosamente",
      pedido
    });
  } catch (error) {
    console.error("Error al confirmar pago:", error);
    return res.status(500).json({ error: "Error interno al confirmar el pago" });
  }
});

app.post('/api/webhook/stripe', (req, res) => {
  const event = req.body;

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const pedido = pedidosDB.find(p => p.paymentIntentId === paymentIntent.id);
    if (pedido && pedido.estadoPago !== "Pagado") {
      pedido.estadoPago = "Pagado";
      pedido.numeroGuia = generarGuiaEnvio(pedido.paqueteria);
    }
  }
  res.json({ received: true });
});

app.get('/api/logistica/rastreo/:guia', (req, res) => {
  const { guia } = req.params;
  const pedido = pedidosDB.find(p => p.numeroGuia && p.numeroGuia.toUpperCase() === guia.toUpperCase());

  if (!pedido) {
    return res.status(404).json({
      error: "No se encontró ningún envío con ese número de guía. Verifica que esté bien escrito."
    });
  }

  return res.status(200).json({
    idOrden: pedido.idOrden,
    numeroGuia: pedido.numeroGuia,
    paqueteria: pedido.paqueteria === "express" ? "DHL Express" : pedido.paqueteria === "fedex" ? "FedEx Nacional" : "Estafeta Estándar",
    codigoPostalDestino: pedido.codigoPostal,
    estadoActual: "En tránsito",
    historial: pedido.historialTracking
  });
});

app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});