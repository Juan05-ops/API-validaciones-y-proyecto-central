const db = require("./db"); // Asegúrate de que esta ruta apunte a tu archivo db.js

db.serialize(() => {
    console.log("Creando tablas...");

    // Tabla de cursos
    db.run(`CREATE TABLE IF NOT EXISTS cursos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        cupo INTEGER NOT NULL
    )`);

    // Tabla de inscripciones
    db.run(`CREATE TABLE IF NOT EXISTS inscripciones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER,
        curso_id INTEGER,
        fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
        FOREIGN KEY (curso_id) REFERENCES cursos(id)
    )`);

    // Insertar un curso de prueba (solo si no existe para no duplicar si corres esto varias veces)
    db.run(`INSERT INTO cursos (nombre, cupo) 
            SELECT 'Ingeniería de Software I', 30 
            WHERE NOT EXISTS (SELECT 1 FROM cursos WHERE nombre = 'Ingeniería de Software I')`);

    console.log("¡Tablas creadas y curso de prueba insertado con éxito!");
});

// Cierra la conexión después de ejecutar
db.close();