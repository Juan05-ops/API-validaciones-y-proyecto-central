const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("./db");

const router = express.Router();

// Clave secreta (mejor ponerla en .env en producción)
const SECRET_KEY = process.env.JWT_SECRET;

router.post("/login", (req, res) => {
    const { email, password } = req.body;

    // Validación básica
    if (!email || !password) {
        return res.status(400).json({ error: "Credenciales inválidas" });
    }

    // Buscar usuario
    db.get("SELECT * FROM usuarios WHERE email = ?", [email], async (err, user) => {
        if (err) {
            return res.status(500).json({ error: "Error en la BD" });
        }

        if (!user) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return res.status(401).json({ error: "Contraseña incorrecta" });
        }

        //  PAYLOAD (información que viajará en el token)
        const payload = {
            id: user.id,
            email: user.email,
            role: user.role
        };

        
        //  GENERAR TOKEN (expira en 1 hora)
        const token = jwt.sign(payload, SECRET_KEY, {
            expiresIn: process.env.TOKEN_EXPIRES
                 });
//
        return res.status(200).json({
            message: "Login exitoso",
            token: token
        });
    });
});

module.exports = router;