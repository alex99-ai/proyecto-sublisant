const TASA_IVA = 0.16;

const ZONAS_ENVIO = {
  LOCAL: {
    nombre: "Zona Metropolitana / Occidente (Jalisco)",
    tarifaBase: 85,
    costoKgExtra: 15,
    diasEstandar: "1 a 2 días hábiles",
  },
  CENTRO: {
    nombre: "Zona Centro / Bajío",
    tarifaBase: 120,
    costoKgExtra: 22,
    diasEstandar: "2 a 4 días hábiles",
  },
  EXTENDIDA: {
    nombre: "Zona Norte / Sur / Frontera",
    tarifaBase: 160,
    costoKgExtra: 30,
    diasEstandar: "3 a 6 días hábiles",
  },
};

export function obtenerZonaPorCP(cp = "") {
  const prefijo = parseInt(cp.substring(0, 2), 10);
  if (isNaN(prefijo)) return ZONAS_ENVIO.CENTRO;

  // Códigos postales de Jalisco (44 al 49)
  if (prefijo >= 44 && prefijo <= 49) return ZONAS_ENVIO.LOCAL;
  // CDMX, EdoMex y Bajío
  if ((prefijo >= 1 && prefijo <= 38) || (prefijo >= 50 && prefijo <= 62)) {
    return ZONAS_ENVIO.CENTRO;
  }
  return ZONAS_ENVIO.EXTENDIDA;
}

export function calcularResumenOrden(items = [], codigoPostal = "44100", paqueteria = "estandar") {
  // 1. Subtotal y peso estimado (0.35 kg por defecto para termos/tazas sublimables)
  const subtotal = items.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
  const pesoTotalKg = items.reduce(
    (acc, item) => acc + (item.pesoKg || 0.35) * item.cantidad,
    0
  );

  // 2. Desglose de IVA (16%)
  const iva = +(subtotal * TASA_IVA).toFixed(2);

  // 3. Cotización por región y paquetería
  const zona = obtenerZonaPorCP(codigoPostal);
  const kilosExtra = Math.max(0, Math.ceil(pesoTotalKg - 1));
  let costoEnvio = zona.tarifaBase + kilosExtra * zona.costoKgExtra;

  let nombrePaqueteria = "EcoEnvío Estándar (Estafeta)";
  let tiempoEstimado = zona.diasEstandar;

  if (paqueteria === "express") {
    costoEnvio += 65;
    nombrePaqueteria = "DHL Express Sustentable";
    tiempoEstimado = "24 horas hábiles";
  } else if (paqueteria === "fedex") {
    costoEnvio += 25;
    nombrePaqueteria = "FedEx Nacional";
    tiempoEstimado = "2 a 3 días hábiles";
  }

  // Envío gratis en compras mayores a $1,200 MXN en modalidad estándar
  const envioGratis = subtotal >= 1200 && paqueteria === "estandar";
  if (envioGratis) {
    costoEnvio = 0;
  }

  const totalFinal = +(subtotal + iva + costoEnvio).toFixed(2);

  return {
    subtotal: +subtotal.toFixed(2),
    iva,
    pesoTotalKg: +pesoTotalKg.toFixed(2),
    costoEnvio: +costoEnvio.toFixed(2),
    envioGratis,
    totalFinal,
    region: zona.nombre,
    nombrePaqueteria,
    tiempoEstimado,
  };
}