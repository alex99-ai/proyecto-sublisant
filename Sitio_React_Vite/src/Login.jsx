import React, {useState} from "react";
import axios from "axios";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const statusHandle = async (e) => {
    e.preventDefault();
    try {
        const respuesta = await axios.post("http://localhost:5000/api/login", {
            email,
            password
        });
        setMessage(`${respuesta.data.message}`);
    } catch (error) {
        if (error.response) {
            setMessage(`X ${error.response.data.error}`);
        } else {
            setMessage("Error de conexión con el servidor");
        }
    
}
};

return (
    <div style={{ padding: "20px", maxWidth: "400px", margin: "50px auto", textAlign: "center", border: "1px solid #ccc", borderRadius: "8px" }}>
        <h2>Login</h2>
        <form onSubmit={statusHandle}>
            <div style={{ marginBottom: "15px" }}>
                <input
                    type="email"
                    placeholder="Correo electrónico"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
            </div>
            <div style={{ marginBottom: "15px" }}>
                <input
                    type="password"
                    placeholder="Contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
                />
            </div>
            <button type="submit" style={{ width: "100%", padding: "10px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
                Ingresar
            </button>
        </form>
        {message && <p style={{marginTop: "15px", fontWeight: "bold"}} >{message}</p>}
    </div>
);
}
export default Login;
