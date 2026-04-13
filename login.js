const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("./db");
const logger = require("./logger"); // Importamos nuestro motor de logs

const router = express.Router();

// Clave secreta (mejor ponerla en .env en producción)
const SECRET_KEY = process.env.JWT_SECRET;

router.post("/login", (req, res) => {
    const { email, password } = req.body;

    // 1. Uso de DEBUG: Datos técnicos para saber qué llega al endpoint
    // Nota: El logger ocultará automáticamente el "password" de req.body
    logger.debug("Petición recibida en endpoint /login", req.body);

    // Validación básica
    if (!email || !password) {
        // 2. Uso de WARNING: Error causado por el usuario (malos inputs)
        logger.warning("Intento de login rechazado: Credenciales incompletas", { email: email || 'No provisto' });
        return res.status(400).json({ error: "Credenciales inválidas" });
    }

    // Buscar usuario
    db.get("SELECT * FROM usuarios WHERE email = ?", [email], async (err, user) => {
        if (err) {
            // 3. Uso de ERROR: Excepciones del sistema o caída de BD
            logger.error("Fallo al consultar la base de datos durante el login", { error: err.message, email });
            return res.status(500).json({ error: "Error en la BD" });
        }

        if (!user) {
            // WARNING: Error del usuario (no existe)
            logger.warning("Intento de login fallido: Usuario no encontrado", { email });
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            // WARNING: Error del usuario (contraseña incorrecta)
            logger.warning("Intento de login fallido: Contraseña incorrecta", { email });
            return res.status(401).json({ error: "Contraseña incorrecta" });
        }

        // PAYLOAD (información que viajará en el token)
        const payload = {
            id: user.id,
            email: user.email,
            role: user.role
        };

        // GENERAR TOKEN (expira en 1 hora)
        const token = jwt.sign(payload, SECRET_KEY, {
            expiresIn: process.env.TOKEN_EXPIRES || '1h'
        });

        // 4. Uso de INFO: Camino feliz
        // Nota: Pasamos el token al logger para probar el filtro de seguridad (OWASP)
        logger.info("Usuario autenticado exitosamente (Camino feliz)", { id: user.id, email: user.email, token_generado: token });

        return res.status(200).json({
            message: "Login exitoso",
            token: token
        });
    });
});

module.exports = router;