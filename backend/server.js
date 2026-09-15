require('dotenv').config();
//variables del entorno para poder usar el .env que viene la info del "servidor"

//usar express para el backend, ayuda a hacer las querys tipo get post
const express = require('express');
const cors = require('cors');
//permite que el backend y el frontend pueda comunicarse en diferentes puertos si no lo usas no pueden comunicarse
const conexion = require('./db');
//aqui son los parametros de la conexion con my sql 

const app = express();
//esat variable es la que usaras para ejecutar las consultas app

//aqui le dices que tiene puertos dif, y permite peticiones desde el front end
app.use(cors());
app.use(express.json());


//aqui genera la ruita desde donde se hara 
app.get('/', (req, res) => {
    //res es la respuesta que vas a tener de la peticion req
    res.json({
        mensaje: 'Backend funcionando'
    });
});


//
app.post('/productos/crud', (req, res) => {
    const {
        accion,
        id,
        nombre,
        descripcion,
        precio,
        stock_actual,
        stock_minimo,
        cant_sugerida_reorden,
        proveedor_id
    } = req.body;
    //para que la informacion llegue en json


    const accionesPermitidas = ['READ', 'CREATE', 'UPDATE', 'DELETE', 'COMPRAR', 'ALTA_STOCK'];
    //comprueba si al accion solicitada es valida
    if (!accionesPermitidas.includes(accion.toUpperCase())) {
        //devuelve el status del servidor 
        return res.status(400).json({
            error: 'Accion no permitida. Solo se permiten READ, CREATE, UPDATE, DELETE, COMPRAR y ALTA_STOCK'
        });
    }
    //llamar el procediemiento almacenado en mysql para hacer la consulta
    const sql = `
        CALL sp_productos_crud(?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    //los ? son para mandarle los parametros si tiene null se omite 
    conexion.query(
        sql,
        [
            accion.toUpperCase(),
            //este es el parametro que si se le mando a el procedimiento almacenado, si no se mando es null
            id ?? null,
            nombre ?? null,
            descripcion ?? null,
            precio ?? null,
            stock_actual ?? null,
            stock_minimo ?? null,
            cant_sugerida_reorden ?? null,
            proveedor_id ?? null
        ],
        (error, resultados) => {

            if (error) {
                console.error('Error en CRUD:', error);

                return res.status(500).json({
                    error: error.sqlMessage || 'Error al ejecutar la operación'
                });
            }
            //si todo sale bien devuelve los resultados de la consulta
            res.json(resultados[0]);
        }
    );
});

app.get('/proveedores', (req, res) => {

    const sql = `
        SELECT *
        FROM proveedores
        ORDER BY id
    `;

    conexion.query(sql, (error, resultados) => {

        if (error) {
            console.error('Error al obtener proveedores:', error);

            return res.status(500).json({
                error: 'Error al obtener proveedores'
            });
        }

        res.json(resultados);
    });
});

app.get('/ventas', (req, res) => {

    const sql = `
        SELECT *
        FROM ventas
        ORDER BY id
    `;

    conexion.query(sql, (error, resultados) => {

        if (error) {
            console.error('Error al obtener ventas:', error);

            return res.status(500).json({
                error: 'Error al obtener ventas'
            });
        }

        res.json(resultados);
    });
});

//acceder a los valores del .env aqui los pides, depende del puerto que tengas es el que utilizara  
app.listen(process.env.PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${process.env.PORT}`);
});