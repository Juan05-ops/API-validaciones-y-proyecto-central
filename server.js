require("dotenv").config();
const express = require("express");
const app = express();


app.use(express.json());

const login = require("./login");
const registro = require("./registro");
const updatePass = require("./updatePass");
const updateRol = require("./updateRol");
const inscripcionesRoutes = require('./inscripciones');
const estadoAcademicoRoutes = require('./estado-academico');
const os = require("os");

app.use(login);
app.use(registro);
app.use(updatePass);
app.use(updateRol);
app.use('/inscripciones', inscripcionesRoutes);
app.use('/estado-academico', estadoAcademicoRoutes);
app.use(express.json());

const PORT = process.env.PORT;

app.listen(PORT, () => {
    console.log("=================================");
    console.log("Aplicación:", process.env.APP_NAME);
    console.log("Puerto:", PORT);
    console.log("Entorno:", process.env.NODE_ENV);
    console.log("Sistema:", os.platform());
    console.log("=================================");
});

app.listen(3000, () => {
    console.log("Servidor corriendo en http://localhost:3000");
});

