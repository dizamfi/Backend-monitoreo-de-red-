const { Schema, model } = require('mongoose');

const QualityOfServiceSchema = Schema({
  date: {
    type: String
  },

  hour: {
    type: String
  },

  mac: {
    type: String
  },

  rssi: {
    type: Number
  },

  noise: {
    type: String
  },

  SNR: {
    type: Number
  },

  RX: {
    type: Number
  },

  RX_Pkts: {
    type: Number
  },

  TX: {
    type: Number
  },

  TX_Pkts:{
    type: Number
  },

  frecuency: {
    type: String
  },

  tipo: {
    type: String
  }


});

module.exports = model('QualityOfService', QualityOfServiceSchema);