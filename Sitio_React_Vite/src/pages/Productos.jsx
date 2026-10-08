import productos from "../data/productos.json";
import ProductCard from "../components/ProductCard";
import "./Productos.css";

function Productos() {
  return (
    <section className="productos">
      <h2>Catálogo EcoTrend</h2>
      <div className="productos__grid">
        {productos.map((p) => (
          <ProductCard key={p.id} producto={p} />
        ))}
      </div>
    </section>
  );
}

export default Productos;