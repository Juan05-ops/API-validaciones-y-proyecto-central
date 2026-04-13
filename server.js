require("dotenv").config();
const express = require("express");
const os = require("os");

const app = express();

// Middleware para leer JSON (Solo se necesita una vez, hasta arriba)
app.use(express.json());

// Importación de rutas
const login = require("./login");
const registro = require("./registro");
const updatePass = require("./updatePass");
const updateRol = require("./updateRol");
const inscripcionesRoutes = require('./inscripciones');
const estadoAcademicoRoutes = require('./estado-academico');

// Uso de rutas
app.use(login);
app.use(registro);
app.use(updatePass);
app.use(updateRol);
app.use('/inscripciones', inscripcionesRoutes);
app.use('/estado-academico', estadoAcademicoRoutes);

// Configuración del puerto (usa el del .env o el 3000 por defecto si falla el .env)
const PORT = process.env.PORT || 3000;

// Levantar el servidor (UNA sola vez)
app.listen(PORT, () => {
    console.log("=================================");
    console.log("Aplicación:", process.env.APP_NAME || "API Escolar");
    console.log("Servidor corriendo en http://localhost:" + PORT);
    console.log("Entorno:", process.env.NODE_ENV || "desarrollo");
    console.log("Sistema:", os.platform());
    console.log("=================================");
});