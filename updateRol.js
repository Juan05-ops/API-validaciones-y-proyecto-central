const express = require("express");
const db = require("./db");
const logger = require("./logger"); // Importamos nuestro motor de logs

const router = express.Router();

// update-role
router.put("/update-role", (req, res) => {
    const { email, role } = req.body;

    // DEBUG: Trazabilidad inicial
    logger.debug("Petición recibida para actualizar rol", { email, role_solicitado: role });

    if (!email || !role) {
        // WARNING: Error del cliente
        logger.warning("Actualización de rol rechazada: Datos incompletos", { 
            email: email || 'No provisto', 
            role: role || 'No provisto' 
        });
        return res.status(400).json({ error: "Datos incompletos" });
    }

    // Validar formato del correo
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        // WARNING: Error del cliente
        logger.warning("Actualización de rol rechazada: Formato de email inválido", { email });
        return res.status(400).json({ error: "Formato de email inválido" });
    }

    // Validación estricta del rol 
    const rolesPermitidos = ['cliente', 'administrador'];
    if (!rolesPermitidos.includes(role.toLowerCase())) {
        // WARNING: Intento de inyección de un rol no permitido
        logger.warning("Actualización de rol rechazada: Rol no permitido", { 
            email, 
            role_intentado: role 
        });
        return res.status(400).json({ error: "Rol no válido. Los roles permitidos son: cliente, administrador" });
    }

    db.get("SELECT * FROM usuarios WHERE email = ?", [email], (err, user) => {
        if (err) {
            // ERROR: Excepción al buscar el usuario
            logger.error("Error en BD al verificar usuario para actualización de rol", { error: err.message, email });
            return res.status(500).json({ error: "Error BD" });
        }

        if (!user) {
            // WARNING: Error lógico/cliente
            logger.warning("Actualización de rol fallida: Usuario inexistente", { email });
            return res.status(404).json({ message: "Usuario no existe" });
        }

        db.run(
            // Guardamos el rol en minúsculas 
            "UPDATE usuarios SET role = ? WHERE email = ?",
            [role.toLowerCase(), email],
            function (err) {
                if (err) {
                    // ERROR/CRITICAL: Fallo al ejecutar el UPDATE
                    logger.critical("Fallo crítico en BD al actualizar el rol del usuario", { error: err.message, email, nuevo_rol: role });
                    return res.status(500).json({ error: "Error BD" });
                }

                // INFO: Camino feliz (Auditoría completa)
                logger.info("Rol de usuario actualizado exitosamente", { 
                    email, 
                    rol_anterior: user.role || 'no_definido', 
                    nuevo_rol: role.toLowerCase() 
                });

                return res.status(200).json({
                    message: "Rol actualizado correctamente"
                });
            }
        );
    });
});

module.exports = router;