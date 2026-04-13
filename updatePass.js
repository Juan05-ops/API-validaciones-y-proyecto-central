const express = require("express");
const bcrypt = require("bcrypt");
const db = require("./db");
const logger = require("./logger"); // Importamos el motor

const router = express.Router();

// update-password
router.put("/update-password", async (req, res) => {
    // 1. Contraseña actual
    const { email, currentPassword, newPassword } = req.body;

    // DEBUG: Registramos el inicio del flujo.
    // Nota: El logger ocultará automáticamente 'currentPassword' y 'newPassword' por nuestro filtro.
    logger.debug("Petición de actualización de contraseña recibida", req.body);

    if (!email || !currentPassword || !newPassword) {
        // WARNING: Error del usuario (faltan datos)
        logger.warning("Intento de actualización de contraseña rechazado: Datos incompletos", { email: email || 'No provisto' });
        return res.status(400).json({ error: "Datos incompletos" });
    }

    // 2. Validar formato del correo
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        // WARNING: Error del usuario (formato de correo inválido)
        logger.warning("Intento de actualización de contraseña rechazado: Formato de email inválido", { email });
        return res.status(400).json({ error: "Formato de email inválido" });
    }

    if (newPassword.length < 8 || newPassword.length > 10) {
        // WARNING: Error del usuario (nueva contraseña no cumple política)
        logger.warning("Intento de actualización de contraseña rechazado: Nueva contraseña fuera de rango", { email });
        return res.status(400).json({ error: "La nueva contraseña debe tener entre 8 y 10 caracteres" });
    }

    // VALIDAR SI EXISTE USUARIO
    db.get("SELECT * FROM usuarios WHERE email = ?", [email], async (err, user) => {
        if (err) {
            // ERROR: Excepción de base de datos al consultar
            logger.error("Error en BD al verificar usuario para actualizar contraseña", { error: err.message, email });
            return res.status(500).json({ error: "Error BD" });
        }

        if (!user) {
            // WARNING: Error del usuario (cuenta no existe)
            logger.warning("Intento de actualización de contraseña fallido: Usuario inexistente", { email });
            return res.status(404).json({ message: "Usuario no existe" });
        }

        // 3. Verificar que la contraseña actual sea la correcta
        const match = await bcrypt.compare(currentPassword, user.password);
        if (!match) {
            // WARNING: Error de autenticación del usuario
            logger.warning("Intento de actualización de contraseña fallido: Contraseña actual incorrecta", { email });
            return res.status(401).json({ error: "La contraseña actual es incorrecta" });
        }

        const hash = await bcrypt.hash(newPassword, parseInt(process.env.SALT_ROUNDS));

        db.run(
            "UPDATE usuarios SET password = ? WHERE email = ?",
            [hash, email],
            function (err) {
                if (err) {
                    // ERROR/CRITICAL: Fallo al guardar la nueva contraseña
                    logger.critical("Fallo crítico en BD al actualizar el hash de la contraseña", { error: err.message, email });
                    return res.status(500).json({ error: "Error BD" });
                }

                // INFO: Camino feliz
                logger.info("Contraseña de usuario actualizada exitosamente", { email });

                return res.status(200).json({
                    message: "Contraseña actualizada correctamente"
                });
            }
        );
    });
});

module.exports = router;