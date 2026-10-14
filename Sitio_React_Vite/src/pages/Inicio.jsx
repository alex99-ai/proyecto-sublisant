import { Link } from "react-router-dom";
import "./Inicio.css";

function Inicio() {
  return (
    <section className="inicio">
      <h1>EcoTrend</h1>
      <p>
        Productos sustentables personalizados por sublimación, hechos con
        tintas de bajo impacto.
      </p>
      <Link className="inicio__boton" to="/productos">Ver catálogo</Link>
    </section>
  );
}

export default Inicio;