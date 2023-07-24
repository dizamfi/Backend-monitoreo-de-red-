const { Schema, model } = require('mongoose');

const InfoHostSchema = Schema({
  date: {
    type: String
  },

  hour: {
    type: String
  },

  mac: {
    type: String
  },

  ip: {
    type: String
  },

  estado: {
    type: String
  },

  latencia: {
    type: Number
  },

  min: {
    type: Number
  },

  max: {
    type: Number
  },

  avg: {
    type: Number
  },

  stddev:{
    type: Number
  },

  packetLoss:{
    type: Number
  }
});

module.exports = model('infoHost', InfoHostSchema);