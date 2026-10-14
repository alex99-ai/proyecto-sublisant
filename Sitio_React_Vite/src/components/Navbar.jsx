import { NavLink } from "react-router-dom";
import "./Navbar.css";
import logo from "../assets/sublisant.jpg";

function Navbar() {
  return (
    <nav className="navbar">
      <NavLink className="navbar__marca" to="/">
        <img src={logo} alt="Logotipo Sublisant" />
        <span>EcoTrend</span>
      </NavLink>
      <div className="navbar__links">
        <NavLink to="/productos">Productos</NavLink>
        <NavLink to="/login">Iniciar sesión</NavLink>
        <NavLink to="/registro">Crear cuenta</NavLink>
      </div>
    </nav>
  );
}

export default Navbar;