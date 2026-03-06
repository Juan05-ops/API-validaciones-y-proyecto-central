const express = require("express");
const bcrypt = require("bcrypt");
const db = require("./db");

const router = express.Router();

// update-password
router.put("/update-password", async (req, res) => {
    // 1. Contraseña actual
    const { email, currentPassword, newPassword } = req.body;

    if (!email || !currentPassword || !newPassword) {
        return res.status(400).json({ error: "Datos incompletos" });
    }

    // 2. Validar formato del correo
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Formato de email inválido" });
    }

    if (newPassword.length < 8 || newPassword.length > 10) {
        return res.status(400).json({ error: "La nueva contraseña debe tener entre 8 y 10 caracteres" });
    }

    // VALIDAR SI EXISTE USUARIO
    db.get("SELECT * FROM usuarios WHERE email = ?", [email], async (err, user) => {
        if (err) return res.status(500).json({ error: "Error BD" });

        if (!user) {
            return res.status(404).json({ message: "Usuario no existe" });
        }

        // 3. Verificar que la contraseña actual sea la correcta
        const match = await bcrypt.compare(currentPassword, user.password);
        if (!match) {
            return res.status(401).json({ error: "La contraseña actual es incorrecta" });
        }

        const hash = await bcrypt.hash(newPassword, parseInt(process.env.SALT_ROUNDS));

        db.run(
            "UPDATE usuarios SET password = ? WHERE email = ?",
            [hash, email],
            function (err) {
                if (err) return res.status(500).json({ error: "Error BD" });

                return res.status(200).json({
                    message: "Contraseña actualizada correctamente"
                });
            }
        );
    });
});

module.exports = router;
