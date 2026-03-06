const express = require("express");
const db = require("./db");
const router = express.Router();

// update-role
router.put("/update-role", (req, res) => {
    const { email, role } = req.body;

    if (!email || !role) {
        return res.status(400).json({ error: "Datos incompletos" });
    }

    // Validar formato del correo
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Formato de email inválido" });
    }

    // Validación estricta del rol 
    const rolesPermitidos = ['cliente', 'administrador'];
    if (!rolesPermitidos.includes(role.toLowerCase())) {
        return res.status(400).json({ error: "Rol no válido. Los roles permitidos son: cliente, administrador" });
    }

    db.get("SELECT * FROM usuarios WHERE email = ?", [email], (err, user) => {
        if (err) return res.status(500).json({ error: "Error BD" });

        if (!user) {
            return res.status(404).json({ message: "Usuario no existe" });
        }

        db.run(
            // Guardamos el rol en minúsculas 
            "UPDATE usuarios SET role = ? WHERE email = ?",
            [role.toLowerCase(), email],
            function (err) {
                if (err) return res.status(500).json({ error: "Error BD" });

                return res.status(200).json({
                    message: "Rol actualizado correctamente"
                });
            }
        );
    });
});

module.exports = router;