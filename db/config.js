const mongoose = require('mongoose');

const connectionDB = async() => {
  try {
    await mongoose.connect(process.env.CONNECT_DB);
    console.log('Database connected');

  } catch (error) {
    console.log(error);
    throw new Error('Error al momento de inicializar la base de datos')
    
  }
}

module.exports = {
  connectionDB
}