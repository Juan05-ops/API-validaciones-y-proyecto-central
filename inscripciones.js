const express = require("express");
const router = express.Router();
const db = require("./db");

//SIMULACIÓN DE SISTEMAS EXTERNOS 
const consultarHistorial = async (usuarioId) => {
    // Simulamos que el estudiante tiene todo aprobado
    return { cumplePrerrequisitos: true, promedio: 8.5 }; 
};

const consultarSAP = async (usuarioId) => {
    // Simulamos que el estudiante no tiene deudas
    return { tieneDeudas: false, saldo: 0 }; 
};
// ----------------------------------------

router.post("/inscribir", async (req, res) => {
    const { usuario_id, curso_id } = req.body;

    if (!Number.isInteger(usuario_id) || usuario_id <= 0 || !Number.isInteger(curso_id) || curso_id <= 0) {
    return res.status(400).json({ error: "Los IDs deben ser números enteros positivos y no contener caracteres inválidos." });
}

    try {
        // 1. Simular consulta a sistemas externos
        const historial = await consultarHistorial(usuario_id);
        const sap = await consultarSAP(usuario_id);

        if (!historial.cumplePrerrequisitos) {
            return res.status(403).json({ error: "El alumno no cumple los prerrequisitos académicos." });
        }
        if (sap.tieneDeudas) {
            return res.status(403).json({ error: "El alumno presenta deudas financieras en SAP." });
        }

        // 2. Verificar si el curso existe y tiene cupo en nuestra BD local
        db.get("SELECT * FROM cursos WHERE id = ?", [curso_id], (err, curso) => {
            if (err) return res.status(500).json({ error: "Error consultando el curso" });
            if (!curso) return res.status(404).json({ error: "Curso no encontrado" });
            if (curso.cupo <= 0) return res.status(400).json({ error: "No hay cupo en este curso" });

            // 3. Registrar la inscripción
            db.run("INSERT INTO inscripciones (usuario_id, curso_id) VALUES (?, ?)", [usuario_id, curso_id], function(err) {
                if (err) return res.status(500).json({ error: "Error al registrar la inscripción" });

                // 4. Restar un cupo al curso
                db.run("UPDATE cursos SET cupo = cupo - 1 WHERE id = ?", [curso_id]);

                return res.status(201).json({ 
                    message: "Inscripción exitosa", 
                    inscripcion_id: this.lastID 
                });
            });
        });

    } catch (error) {
        return res.status(500).json({ error: "Error interno de los sistemas" });
    }
});

module.exports = router;