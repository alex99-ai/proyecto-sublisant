function ProductCard({ producto }) {
  return (
    <article className="product-card">
      <div className="product-card__img">
        {producto.imagen ? (
          <img src={producto.imagen} alt={producto.nombre} loading="lazy" />
        ) : (
          <span>🌿</span>
        )}
      </div>
      <h3>{producto.nombre}</h3>
      <p>{producto.descripcion}</p>
      <div className="product-card__footer">
        <strong>${producto.precio} MXN</strong>
        <small>{producto.stock} disponibles</small>
      </div>
    </article>
  );
}

export default ProductCard;