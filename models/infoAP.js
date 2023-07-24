const { Schema, model } = require('mongoose');

const InfoAPSchema = Schema({
  date: {
    type: String
  },

  hour: {
    type: String
  },

  interface: {
    type: String
  },

  mac: {
    type: String
  },

  estado: {
    type: String
  },

  txPkts: {
    type: String
  },

  transmittedBytes: {
    type: String
  },

  rxPkts: {
    type: String
  },

  receivedBytes: {
    type: String
  },

  speed: {
    type: String
  },

  type:{
    type: String
  },
});

module.exports = model('infoAP', InfoAPSchema);