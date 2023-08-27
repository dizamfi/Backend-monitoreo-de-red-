const snmp = require("snmp-native");
const ping = require("ping");
const infoHost = require("../models/infoHost");
const { connectionDB } = require("../db/config");


// connectionDB();


const ejecutarScriptSnmp = (ip) => {

  // Parámetros de conexión SNMP al router
const options = {
  host: ip,
  port: 161,
  community: "public", 
};

// OID para obtener la tabla de direcciones MAC
const macTableOid = [1, 3, 6, 1, 2, 1, 4, 22, 1, 2];

setInterval(() => {

  // Crea una instancia SNMP
  const session = new snmp.Session(options);

  // Función para obtener la tabla de direcciones MAC
  function getMacTable(callback) {
    session.getSubtree({ oid: macTableOid }, callback);
  }
  const fechaActual = new Date();
  
  function formatMacAddress(hex) {
    const macAddress = hex.match(/../g).join(":");
    return macAddress;
  } 
  getMacTable((error, varbinds) => {
    if (error) {
      console.error("Error:", error);
    } else {
      varbinds.forEach((varbind) => {
        const ip = varbind.oid.slice(11, 15).toString().replace(/\./g, ".");
        const macAddress = formatMacAddress(varbind.valueHex);
        ping.promise
          .probe(ip.replace(/,/g, '.'), { timeout: 5, min_reply: 4 }) // Se establece un tiempo de espera de 5 segundos y se considera dos paquetes mínimo para que sea un ping exitoso
          .then((result) => {
            const fechayhora = fechaActual.toLocaleString().split(",");
            const fecha = fechayhora[0];
            const hora = fechayhora[1]; 
            if (result.alive) {
              const model = new infoHost({
                date: fecha,
                hour: hora,
                mac: macAddress,
                ip: ip.replace(/,/g, '.'),
                latencia: parseFloat(result.time),
                min: parseFloat(result.min),
                max: parseFloat(result.max),
                avg: parseFloat(result.avg),
                stddev: parseFloat(result.stddev),
                packetLoss: parseInt(result.packetLoss),
              });
  
              model.save();
            }
          })
          .catch((error) => {
            console.error("Error:", error);
          });
      });
    }
    session.close();
  });

}, 10000);


}

module.exports = ejecutarScriptSnmp;