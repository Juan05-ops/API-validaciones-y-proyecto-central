const express = require("express");
const bcrypt = require("bcrypt");
const db = require("./db");

const router = express.Router();

router.post("/registro", async (req, res) => {
    const { email, password } = req.body;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        return res.status(400).json({ error: "Formato de email inválido" });
    }

    // Validación de contraseña
    if (!password || password.length < 8 || password.length > 10) {
        return res.status(400).json({ error: "La contraseña debe tener entre 8 y 10 caracteres" });
    }

    // Verificar duplicado
    db.get("SELECT * FROM usuarios WHERE email = ?", [email], async (err, row) => {
        if (err) return res.status(500).json({ error: "Error BD" });

        if (row) {
            return res.status(409).json({ error: "El usuario ya existe" });
        }

        // Hash de contraseña
        const hash = await bcrypt.hash(password, parseInt(process.env.SALT_ROUNDS));

        // Insertar usuario
        db.run(
            "INSERT INTO usuarios (email, password) VALUES (?, ?)",
            [email, hash],
            function (err) {
                if (err) {
                    return res.status(500).json({ error: "Error al registrar" });
                }
                return res.status(201).json({ message: "Usuario Registrado" });
            }
        );
    });
});

module.exports = router;
