const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');

const app = express();
const PORT = 5000;

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

    // Guardar el usuario con la contraseña protegida
    const nuevoUsuario = {
      id: usuariosDB.length + 1,
      email: email,
      password: hashedPassword // 👈 Guardamos la versión encriptada, nunca la real
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

app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});