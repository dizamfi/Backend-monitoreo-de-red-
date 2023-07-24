const express = require('express');
// creando servidor de express
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);
require('dotenv').config();
const cors = require('cors');
const { connectionDB } = require('./db/config');
const hostNmap = require('./models/hostNmap');

// const cors = require('cors');
io.on('connection', (socket) => {
  console.log('Nuevo cliente conectado');
  socket.on('disconnect', () => {
    console.log('Cliente desconectado');
  });
});

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
app.use('/api/auth', require('./routes/auth'));

app.use('/api/network', require('./routes/network'));

hostNmap.watch().on('change', (change) => {
  if (change.operationType === 'insert' || change.operationType === 'update') {
    io.emit('registroActualizado', change.documentKey._id);
  }
});



// Escuchando las peticiones
server.listen( process.env.PORT, () => {
  console.log(`Servidor ejecutandose en puerto ${ process.env.PORT }`);
});