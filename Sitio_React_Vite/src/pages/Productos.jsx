import { useEffect, useState } from "react";
import axios from "axios";
import ProductCard from "../components/ProductCard";
import "./Productos.css";

function Productos() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/productos")
      .then((res) => setProductos(res.data))
      .catch(() => setError("No se pudo cargar el catálogo. ¿Está encendido el servidor?"))
      .finally(() => setCargando(false));
  }, []);

  return (
    <section className="productos">
      <h2>Catálogo EcoTrend</h2>
      {cargando && <p>Cargando productos...</p>}
      {error && <p>{error}</p>}
      <div className="productos__grid">
        {productos.map((p) => (
          <ProductCard key={p.id} producto={p} />
        ))}
      </div>
    </section>
  );
}

export default Productos;