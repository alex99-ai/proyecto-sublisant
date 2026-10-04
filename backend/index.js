const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const usuariosDB = [];

app.post('/api/registro', async (req, res) => {
    try {
        const { email, password } = req.body;


        if (!email || !password) {
            return res.status(400).json({ error: "Faltan campos obligatorios" });
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Guardar el usuario con la contraseña protegida
        const nuevoUsuario = {
            id: usuariosDB.length + 1,
            email: email,
            password: hashedPassword // 👈 Guardamos la versión encriptada, nunca la real
        };

        usuariosDB.push(nuevoUsuario);
        console.log("Usuario registrado con éxito:", nuevoUsuario);

        res.status(201).json({ mensaje: "Usuario registrado exitosamente" });

    } catch (error) {
        res.status(500).json({ error: "Error en el servidor al registrar" });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});

async function loginUsuario(req, res) {
    try {
    const { email, password } = req.body;
if (!email || !password) {
        return res.status(400).json({ error: "Faltan campos obligatorios" });
    }
 
    const usuario = usuariosDB.find(u => u.email === email);

    if (!usuario) {
        return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    const contrasenaValida = await bcrypt.compare(password, usuario.password);

    if (!contrasenaValida) {
        return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    return res.status(200).json({ message: "Login correcto" });
}  catch (error) {
    console.error("Error al iniciar sesión:", error);
    return res.status(500).json({ error: "Error en el servidor al iniciar sesión" });
}
}
app.post('/api/login', loginUsuario);