const Client = require("ssh2").Client;
const { connectionDB } = require("../db/config");
const qualityOfService = require("../models/QualityOfService");
const { getIO } = require("../sockets/socketManager");

// connectionDB();

const ejecutarScriptQualityOfServices = (ip) => {

const sshConfig = {
  host: ip,
  port: 22,
  username: "root",
  password: "utpU3oxLrb2F",
};

const rutaArchivo = "/datastore/data.txt";

function almacenarDatosCalidadRed() {
  const conn = new Client();
  conn
    .on("ready", () => {

      conn.exec(`cat ${rutaArchivo}`, (err, stream) => {
        if (err) {
          reject(err);
          return;
        }
        let data = "";
        stream.on("data", (chunk) => {
          data += chunk.toString();
        });

        stream.on("close", () => {
          const lines = data.split("\n");
          lines.slice(0, -1).map(async (line) => {
            const lineSinEspacios = line.replace(/ +/g, ",");
            const values = lineSinEspacios.split(",");
            if (!(values.includes('connectedNo'))){
              const model = new qualityOfService({
                date: values[0],
                hour: values[1],
                mac: values[2],
                rssi: parseInt(values[3]),
                noise: values[values.findIndex((elemento) => elemento.includes("/")) + 1],
                SNR: parseInt(values[values.findIndex((elemento) => elemento.includes("SNR")) + 1].replace(/\(|\)/g, "")),
                RX:  parseFloat(values[values.findIndex((elemento) => elemento.includes("RX")) + 1]),
                RX_Pkts: parseFloat(values[values.findIndex((elemento) => elemento.includes("TX")) - 1]),
                TX: parseFloat(values[values.findIndex((elemento) => elemento.includes("TX")) + 1]),
                TX_Pkts: parseFloat(values[values.findIndex((elemento) => elemento.includes("expected")) - 1]),
                frecuency: values[values.length - 1]
              });
  
              await model.save(); 

              const io = getIO();
              io.emit("NewDevicesConected", "DevicesConected");
            }           
          });

          conn.exec(`rm ${rutaArchivo}`, (err, stream) => {
            if (err) {
              console.error("Error al eliminar la línea del archivo:", err);
              return;
            }
            stream.on("close", () => {
              console.log("Línea eliminada del archivo");
              conn.end();
            });
            almacenarDatosCalidadRed();
          });
        });
      });
    })
    .connect(sshConfig);

    
}

almacenarDatosCalidadRed();

}


module.exports = ejecutarScriptQualityOfServices;