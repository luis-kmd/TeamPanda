// src/config/db.js
require('dotenv').config();
const mysql = require('mysql2');

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Transforma callbacks em Promises (para usar await/async)
const db = pool.promise();

// Teste rápido de conexão
pool.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Erro ao conectar no MySQL:', err.code);
    } else {
        console.log('✅ Conectado ao MySQL com sucesso!');
        connection.release();
    }
});

module.exports = db;