const express = require("express");
const router = express.Router();
const db = require("./db");
const logger = require("./logger"); // Importamos nuestro motor

// SIMULACIÓN DE SISTEMAS EXTERNOS 
const consultarHistorial = async (usuarioId) => {
    return { estado: "Regular", materiasAdeudadas: 0, promedio: 8.5 }; 
};

const consultarSAP = async (usuarioId) => {
    return { estadoPago: "Al corriente", proximoVencimiento: "2026-04-01" }; 
};

router.get("/:id/resumen", async (req, res) => {
    const parametroId = req.params.id;
    
    // DEBUG: Registramos la llegada de la petición para trazabilidad
    logger.debug("Petición GET recibida en /resumen", { id_solicitado: parametroId });

    const usuarioId = parseInt(parametroId, 10);
    
    if (isNaN(usuarioId) || usuarioId <= 0) {
        // WARN: Error del cliente al mandar un ID que no es número válido
        logger.warning("Consulta de resumen rechazada: ID de estudiante inválido", { parametro_recibido: parametroId });
        return res.status(400).json({ error: "El ID del estudiante debe ser un número entero positivo" });
    }

    // 1. Buscar al usuario en nuestra BD
    db.get("SELECT id, email, role FROM usuarios WHERE id = ?", [usuarioId], async (err, usuario) => {
        if (err) {
            // ERROR: Fallo al consultar la tabla de usuarios
            logger.error("Error en BD al buscar estudiante para el resumen", { error: err.message, usuarioId });
            return res.status(500).json({ error: "Error en la base de datos" });
        }
        
        if (!usuario) {
            // WARN: El ID es válido, pero no existe en la base de datos
            logger.warning("Consulta de resumen fallida: Estudiante no encontrado", { usuarioId });
            return res.status(404).json({ error: "Estudiante no encontrado" });
        }

        try {
            // 2. Traer datos de sistemas externos
            const datosHistorial = await consultarHistorial(usuarioId);
            const datosSAP = await consultarSAP(usuarioId);

            // 3. Buscar las inscripciones activas de este usuario en nuestra BD
            db.all(`
                SELECT c.nombre, i.fecha 
                FROM inscripciones i 
                JOIN cursos c ON i.curso_id = c.id 
                WHERE i.usuario_id = ?
            `, [usuarioId], (err, inscripciones) => {
                if (err) {
                    // ERROR: Fallo al cruzar las tablas de inscripciones y cursos
                    logger.error("Error en BD al buscar inscripciones activas", { error: err.message, usuarioId });
                    return res.status(500).json({ error: "Error al buscar inscripciones" });
                }

                // 4. Armar la respuesta unificada 
                const perfilCompleto = {
                    datos_personales: usuario,
                    historial_academico: datosHistorial,
                    situacion_financiera: datosSAP,
                    cursos_inscritos: inscripciones
                };

                // INFO: Camino feliz
                // Guardamos en el log el éxito de la operación y algunos datos estadísticos útiles
                logger.info("Resumen académico generado exitosamente", { 
                    usuarioId, 
                    email: usuario.email, 
                    total_cursos_inscritos: inscripciones.length 
                });

                return res.status(200).json(perfilCompleto);
            });

        } catch (error) {
            // ERROR: Falla al resolver las promesas de los sistemas externos (Historial/SAP)
            logger.error("Error al conectar con sistemas externos (Historial o SAP)", { 
                error: error.message, 
                stack: error.stack, 
                usuarioId 
            });
            return res.status(500).json({ error: "Error al conectar con Historial o SAP" });
        }
    });
});

module.exports = router;