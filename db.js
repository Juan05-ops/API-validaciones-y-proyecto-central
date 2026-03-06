require("dotenv").config();
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Tomamos el nombre desde .env
const dbPath = path.join(__dirname, process.env.DB_NAME);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error(" Error al conectar a SQLite:", err.message);
    } else {
        console.log(" Conectado a SQLite");
        console.log("Base de datos:", process.env.DB_NAME);
        console.log(" Entorno:", process.env.NODE_ENV);
    }
});

module.exports = db;