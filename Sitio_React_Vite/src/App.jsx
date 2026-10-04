import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import Login from './Login';
import Registro from './Registro';

function App() {
  return (
    <Router>
      <div style={{ fontFamily: 'Arial, sans-serif'}}>
        
    <nav style={{ backgroundColor: '#f4f4f4', padding: '10px', textAlign: 'center', marginBottom: '20px' }}>
       <Link to= "/" style={{ margin: '0 15px', textDecoration: 'none', color: '#007bff', fontWeight: 'bold' }}>
       Iniciar Sesión
       </Link>
     <span style={{ color: '#ccc' }}>|</span>
     <Link to= "/registro" style={{ margin: '0 15px', textDecoration: 'none', color: '#28a745', fontWeight: 'bold' }}>
     Crear Cuenta
     </Link>

    </nav>
    
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/registro" element={<Registro />} />
    </Routes>
  </div>
</Router>
  );
}


export default App;
