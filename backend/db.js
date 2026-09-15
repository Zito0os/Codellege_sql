const mysql = require('mysql2');

const conexion = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

conexion.getConnection((error, connection) => {
    if (error) {
        console.error('Error al conectar con MySQL:', error);
    } else {
        console.log('Conexión exitosa con MySQL');
        connection.release();
    }
});

module.exports = conexion;