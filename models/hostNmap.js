const { Schema, model } = require('mongoose');

const HostNmapSchema = Schema({
  date: {
    type: String
  },

  status: {
    type: String
  },

  mac: {
    type: String,
    required: true
  },

  ip: {
    type: String,
    required: true
  },

  ports: {
    type: Array
  },

  rttvar: {
    type: String,
  },

  srtt: {
    type: String
  },

  to: {
    type: String
  },

});

module.exports = model('HostNmap', HostNmapSchema);