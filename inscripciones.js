const express = require("express");
const router = express.Router();
const db = require("./db");
const logger = require("./logger"); // Importamos el motor

// SIMULACIÓN DE SISTEMAS EXTERNOS 
const consultarHistorial = async (usuarioId) => {
    return { cumplePrerrequisitos: true, promedio: 8.5 }; 
};

const consultarSAP = async (usuarioId) => {
    return { tieneDeudas: false, saldo: 0 }; 
};

router.post("/inscribir", async (req, res) => {
    const { usuario_id, curso_id } = req.body;

    // 1. DEBUG: Trazabilidad de entrada
    logger.debug("Iniciando proceso de inscripción", { usuario_id, curso_id });

    if (!Number.isInteger(usuario_id) || usuario_id <= 0 || !Number.isInteger(curso_id) || curso_id <= 0) {
        // 2. WARNING: Error de validación de entrada
        logger.warning("Intento de inscripción con IDs inválidos", req.body);
        return res.status(400).json({ error: "Los IDs deben ser números enteros positivos." });
    }

    try {
        const historial = await consultarHistorial(usuario_id);
        const sap = await consultarSAP(usuario_id);

        if (!historial.cumplePrerrequisitos) {
            // WARNING: Regla de negocio no cumplida (académico)
            logger.warning("Inscripción rechazada: El alumno no cumple prerrequisitos", { usuario_id, curso_id });
            return res.status(403).json({ error: "El alumno no cumple los prerrequisitos académicos." });
        }
        if (sap.tieneDeudas) {
            // WARNING: Regla de negocio no cumplida (financiero)
            logger.warning("Inscripción rechazada: Deuda en SAP detectada", { usuario_id, saldo: sap.saldo });
            return res.status(403).json({ error: "El alumno presenta deudas financieras en SAP." });
        }

        // 3. Verificar curso en BD
        db.get("SELECT * FROM cursos WHERE id = ?", [curso_id], (err, curso) => {
            if (err) {
                // 3. ERROR: Falla técnica en consulta
                logger.error("Error al consultar tabla 'cursos'", { error: err.message, curso_id });
                return res.status(500).json({ error: "Error consultando el curso" });
            }
            
            if (!curso) {
                logger.warning("Intento de inscripción a curso inexistente", { curso_id });
                return res.status(404).json({ error: "Curso no encontrado" });
            }
            
            if (curso.cupo <= 0) {
                logger.warning("Inscripción rechazada: Sin cupo disponible", { curso_id, nombre: curso.nombre });
                return res.status(400).json({ error: "No hay cupo en este curso" });
            }

            // 4. Registrar inscripción
            db.run("INSERT INTO inscripciones (usuario_id, curso_id) VALUES (?, ?)", [usuario_id, curso_id], function(err) {
                if (err) {
                    // CRITICAL/ERROR: Error al persistir datos de negocio
                    logger.critical("Fallo crítico al insertar inscripción", { error: err.message, usuario_id, curso_id });
                    return res.status(500).json({ error: "Error al registrar la inscripción" });
                }

                const inscripcionId = this.lastID;

                // 5. Actualizar cupo
                db.run("UPDATE cursos SET cupo = cupo - 1 WHERE id = ?", [curso_id], (updateErr) => {
                    if (updateErr) {
                        logger.error("Error al actualizar cupo del curso", { curso_id, error: updateErr.message });
                    }
                });

                // 4. INFO: Camino feliz
                logger.info("Inscripción completada exitosamente", { 
                    inscripcion_id: inscripcionId, 
                    usuario_id, 
                    curso_id 
                });

                return res.status(201).json({ 
                    message: "Inscripción exitosa", 
                    inscripcion_id: inscripcionId 
                });
            });
        });

    } catch (error) {
        // ERROR: Captura de excepciones inesperadas
        logger.error("Excepción interna en proceso de inscripción", { mensaje: error.message, stack: error.stack });
        return res.status(500).json({ error: "Error interno de los sistemas" });
    }
});

module.exports = router;