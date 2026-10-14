import { useCart } from "../context/CartContext";

function ProductCard({ producto }) {
  const { items, agregar } = useCart();
  const enCarrito = items.find((i) => i.id === producto.id)?.cantidad ?? 0;
  const sinStock = producto.stock < 1;
  const alMaximo = enCarrito >= producto.stock;

  return (
    <article className="product-card">
      <div className="product-card__img">
        {producto.imagen ? (
          <img src={producto.imagen} alt={producto.nombre} loading="lazy" />
        ) : (
          <span>🛒</span>
        )}
      </div>
      <h3>{producto.nombre}</h3>
      <p>{producto.descripcion}</p>
      <div className="product-card__footer">
        <strong>${producto.precio} MXN</strong>
        <small>{producto.stock} disponibles</small>
      </div>
      <button
        className="product-card__boton"
        onClick={() => agregar(producto)}
        disabled={sinStock || alMaximo}
      >
        {sinStock ? "Agotado" : alMaximo ? "Máximo en carrito" : "Agregar al carrito"}
      </button>
    </article>
  );
}

export default ProductCard;

