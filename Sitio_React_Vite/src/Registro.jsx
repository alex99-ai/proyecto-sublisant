import React, { useState } from 'react';
import axios from 'axios';

function Registro() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [mensaje, setMensaje] = useState('');

    const registroHandler = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:5000/api/registro', { email, password });
            setMensaje( ` ${response.data.mensaje || 'Usuario registrado exitosamente'}` );
            setEmail('');
            setPassword('');
        } catch (error) {
            if (error. response) {
                setMensaje(`Error: ${error.response.data.error || 'Error en el registro'}`);
            } else {
                setMensaje('Error: No se pudo conectar con el servidor');
            }
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', textAlign: 'center', border: '1px solid #ccc', borderRadius: '8px' }}>
            <h2>Crear Cuenta</h2>
            <form onSubmit={registroHandler}>
                <div style={{ marginBottom: '15px' }}>
                    <input
                        type="email"
                        placeholder="Correo electrónico"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                    />
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <input
                        type="password"
                        placeholder="Contraseña"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                <button type="submit" style={{ width: '100%', backgroundColor: '#28a745', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer' }}>
                    Registrarse
                </button>
            </form>
            {mensaje && (
                <p style={{ marginTop: '15px', fontWeight: 'bold' }}>
                    {mensaje}
                </p>
            )}
        </div>
    );
}

export default Registro;