const fs = require('fs');
const path = require('path');

const logFilePath = path.join(__dirname, 'app.log');

// Filtro Crítico de Seguridad (OWASP) - VERSIÓN MEJORADA
function sanitizarDatos(data) {
    // Expresión regular para detectar la estructura de un JWT (empiezan con eyJ)
    const regexJWT = /(eyJ[a-zA-Z0-9_-]{5,}\.eyJ[a-zA-Z0-9_-]{5,}\.)[a-zA-Z0-9_-]*/g;

    // 1. Si el dato principal es un string, aplicar regex
    if (typeof data === 'string') {
        return data.replace(regexJWT, '$1***[ENMASCARADO]');
    }
    
    // 2. Si es un objeto, revisar sus propiedades
    if (typeof data === 'object' && data !== null) {
        const sanitizado = { ...data };
        const llavesSensibles = ['password', 'token', 'jwt', 'contraseña', 'tarjeta', 'cvv'];
        
        for (let key in sanitizado) {
            const keyLower = key.toLowerCase();
            
            // CAPA A: ¿La llave CONTIENE alguna palabra sensible? (ej. "token_generado" o "jwt_token")
            const esLlaveSensible = llavesSensibles.some(palabra => keyLower.includes(palabra));

            if (esLlaveSensible) {
                sanitizado[key] = '***[PROTEGIDO]***';
            } 
            else if (typeof sanitizado[key] === 'object') {
                // Recursividad para objetos dentro de objetos
                sanitizado[key] = sanitizarDatos(sanitizado[key]); 
            } 
            else if (typeof sanitizado[key] === 'string') {
                // CAPA B: Aunque la llave sea inocente (ej. "datosExtra"), si el contenido parece JWT, lo cortamos
                sanitizado[key] = sanitizado[key].replace(regexJWT, '$1***[ENMASCARADO]');
            }
        }
        return sanitizado;
    }
    return data;
}

// Formateador exacto requerido
function escribirLog(nivel, mensaje, meta = null) {
    const fechaHora = new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' });
    
    let infoExtra = '';
    if (meta) {
        const metaSegura = sanitizarDatos(meta);
        infoExtra = ` - Detalles: ${JSON.stringify(metaSegura)}`;
    }

    const lineaLog = `[${fechaHora}] | [${nivel}] | ${mensaje}${infoExtra}\n`;
    
    fs.appendFileSync(logFilePath, lineaLog, 'utf8');
}

const logger = {
    debug: (msg, meta) => escribirLog('DEBUG', msg, meta),
    info: (msg, meta) => escribirLog('INFO', msg, meta),
    warning: (msg, meta) => escribirLog('WARNING', msg, meta),
    error: (msg, meta) => escribirLog('ERROR', msg, meta),
    critical: (msg, meta) => escribirLog('CRITICAL', msg, meta),
};

module.exports = logger;