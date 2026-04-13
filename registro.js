const express = require("express");
const bcrypt = require("bcrypt");
const db = require("./db");
const logger = require("./logger"); // 1. Importamos el motor de logs

const router = express.Router();

router.post("/registro", async (req, res) => {
    const { email, password } = req.body;

    // Uso de DEBUG: Trazabilidad inicial
    // El motor ocultará automáticamente 'password' gracias a nuestro filtro OWASP
    logger.debug("Petición recibida en endpoint /registro", req.body);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        // Uso de WARNING: Error del usuario por mal formato de email
        logger.warning("Intento de registro rechazado: Formato de email inválido", { email_recibido: email || 'Vacío' });
        return res.status(400).json({ error: "Formato de email inválido" });
    }

    // Validación de contraseña
    if (!password || password.length < 8 || password.length > 10) {
        // Uso de WARNING: Error del usuario por contraseña que no cumple reglas
        logger.warning("Intento de registro rechazado: Contraseña fuera del rango permitido (8-10 caracteres)", { email });
        return res.status(400).json({ error: "La contraseña debe tener entre 8 y 10 caracteres" });
    }

    // Verificar duplicado
    db.get("SELECT * FROM usuarios WHERE email = ?", [email], async (err, row) => {
        if (err) {
            // Uso de ERROR: Falla al comunicarse con la base de datos
            logger.error("Fallo en BD al verificar usuario duplicado", { error: err.message, email });
            return res.status(500).json({ error: "Error BD" });
        }

        if (row) {
            // Uso de WARNING: Error lógico/usuario (intenta registrar correo existente)
            logger.warning("Intento de registro fallido: El usuario ya existe", { email });
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
                    // Uso de ERROR: Falla de base de datos durante la escritura (ej. disco lleno o tabla bloqueada)
                    logger.error("Fallo crítico al insertar el nuevo usuario en la BD", { error: err.message, email });
                    return res.status(500).json({ error: "Error al registrar" });
                }
                
                // Uso de INFO: Camino feliz
                // En SQLite usando 'function (err)' clásico, 'this.lastID' nos da el ID recién creado
                logger.info("Usuario registrado exitosamente (Camino feliz)", { id_nuevo_usuario: this.lastID, email });
                
                return res.status(201).json({ message: "Usuario Registrado" });
            }
        );
    });
});

module.exports = router;