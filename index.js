const express = require('express');
require('dotenv').config();
const cors = require('cors');
const { connectionDB } = require('./db/config');
// const cors = require('cors');

// creando servidor de express
const app = express();

// DB
connectionDB();

// Habilitar CORS para todas las rutas
app.use(cors());

// Public
app.use( express.static('public') );

// Lectura y parseo del body (analiza el body de las 
// solicitudes en formato json y lo convierte en un objeto
// en javascript el cual se almacena en req)
app.use( express.json() );

// Rutas
app.use('/auth', require('./routes/auth'));

app.use('/ports', require('./routes/ports'));

// Escuchando las peticiones
app.listen( process.env.PORT, () => {
  console.log(`Servidor ejecutandose en puerto ${ process.env.PORT }`);
});