const socketIo = require('socket.io');

let io;

function initializeSocket(server) {
  io = socketIo(server, {
    cors: { origin: '*' }
  });

  io.on('connection', (socket) => {
    console.log('Un cliente se ha conectado');

    socket.on('disconnect', () => {
      console.log('Un cliente se ha desconectado');
    });
  });
}

function getIO() {
  return io;
}

module.exports = { initializeSocket, getIO };