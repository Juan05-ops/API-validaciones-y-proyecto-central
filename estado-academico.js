const express = require("express");
const router = express.Router();
const db = require("./db");

// SIMULACIÓN DE SISTEMAS EXTERNOS 
const consultarHistorial = async (usuarioId) => {
    return { estado: "Regular", materiasAdeudadas: 0, promedio: 8.5 }; 
};

const consultarSAP = async (usuarioId) => {
    return { estadoPago: "Al corriente", proximoVencimiento: "2026-04-01" }; 
};

router.get("/:id/resumen", async (req, res) => {
    const usuarioId = parseInt(req.params.id, 10);
    
    if (isNaN(usuarioId) || usuarioId <= 0) {
        return res.status(400).json({ error: "El ID del estudiante debe ser un número entero positivo" });
    }

    // 1. Buscar al usuario en nuestra BD
    db.get("SELECT id, email, role FROM usuarios WHERE id = ?", [usuarioId], async (err, usuario) => {
        if (err) return res.status(500).json({ error: "Error en la base de datos" });
        if (!usuario) return res.status(404).json({ error: "Estudiante no encontrado" });

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
                if (err) return res.status(500).json({ error: "Error al buscar inscripciones" });

                // 4. Armar la respuesta unificada 
                const perfilCompleto = {
                    datos_personales: usuario,
                    historial_academico: datosHistorial,
                    situacion_financiera: datosSAP,
                    cursos_inscritos: inscripciones
                };

                return res.status(200).json(perfilCompleto);
            });

        } catch (error) {
            return res.status(500).json({ error: "Error al conectar con Historial o SAP" });
        }
    });
});

module.exports = router;