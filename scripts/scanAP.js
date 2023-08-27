const snmp = require("snmp-native");
const infoHost = require("../models/infoAP");
// const { connectionDB } = require("../db/config.js");
const { getIO } = require("../sockets/socketManager");

// connectionDB();
// 200.126.23.247
const ejecutarScriptAP = (ip) => {
  // Parámetros de conexión SNMP al router
  const options = {
    host: ip,
    port: 161,
    community: "public",
  };

  // OID para obtener la tabla de direcciones MAC

  const macTableOid = [1, 3, 6, 1, 2, 1, 2, 2, 1, 2];

  const prueba = [1, 3, 6, 1, 4, 1, 9, 9, 273, 1, 3, 1, 1, 3, 2, 5];

  // OID para obtener el estado operativo de las interfaces
  const ifOperStatusOID = [1, 3, 6, 1, 2, 1, 2, 2, 1, 8];

  // OID para la cantidad de paquetes transmitidos
  const ifOutUcastPkts = [1, 3, 6, 1, 2, 1, 2, 2, 1, 17];

  // OID para la cantidad de bytes transmitidos
  const ifOutOctets = [1, 3, 6, 1, 2, 1, 2, 2, 1, 16];

  // OID para la cantidad de paquetes recibidos
  const ifInUcastPkts = [1, 3, 6, 1, 2, 1, 2, 2, 1, 10];

  // OID para la cantidad de bytes recibidos
  const ifInOctets = [1, 3, 6, 1, 2, 1, 2, 2, 1, 9];

  // OID para obtener la mac de la interfaz
  const ifPhysAddressOID = [1, 3, 6, 1, 2, 1, 2, 2, 1, 6];

  // OID para obtener la mac de la interfaz
  const ifSpeedOID = [1, 3, 6, 1, 2, 1, 2, 2, 1, 5];

  // OID para obtener el tipo de interfaz
  const ifType = [1, 3, 6, 1, 2, 1, 2, 2, 1, 3];

  const hosts_ant = {}; // Objeto para guardar el estado anterior de hosts

  const intervalId = setInterval(() => {
    // Se crea una instancia SNMP
    const session = new snmp.Session(options);

    const hosts = {}; // Objeto para guardar la información actual

    const fechaActual = new Date();

    session.getSubtree({ oid: macTableOid }, (error, varbinds) => {
      if (error) {
        console.error("Error:", error);
      } else {
        varbinds.forEach((varbind) => {
          hosts[varbind.oid.slice(10).toString()] = {
            interface: varbind.value,
          };
        });
      }
    });

    session.getSubtree({ oid: ifOperStatusOID }, (error, varbinds) => {
      if (error) {
        console.error("Error:", error);
      } else {
        varbinds.forEach((varbind) => {
          hosts[varbind.oid.slice(10).toString()]["estado"] =
            varbind.value == 1 ? "up" : "down";
        });
      }
    });

    session.getSubtree({ oid: ifOutUcastPkts }, (error, varbinds) => {
      if (error) {
        console.error("Error:", error);
      } else {
        varbinds.forEach((varbind) => {
          if (Object.keys(hosts_ant).length > 0) {
            const pkts =
              parseInt(varbind.value) -
              parseInt(hosts_ant[varbind.oid.slice(10).toString()]["txPkts"]);
            hosts[varbind.oid.slice(10).toString()]["txPkts"] = `${pkts} Pkts`;
          } else {
            hosts[varbind.oid.slice(10).toString()][
              "txPkts"
            ] = `${varbind.value} Pkts`;
          }
        });
      }
    });

    session.getSubtree({ oid: ifOutOctets }, (error, varbinds) => {
      if (error) {
        console.error("Error:", error);
      } else {
        varbinds.forEach((varbind) => {
          if (Object.keys(hosts_ant).length > 0) {
            const bytesTx =
              parseInt(varbind.value) -
              parseInt(
                hosts_ant[varbind.oid.slice(10).toString()]["transmittedBytes"]
              );
            hosts[varbind.oid.slice(10).toString()][
              "transmittedBytes"
            ] = `${bytesTx} bytes`;
          } else {
            hosts[varbind.oid.slice(10).toString()][
              "transmittedBytes"
            ] = `${varbind.value} bytes`;
          }
        });
      }
    });

    session.getSubtree({ oid: ifInUcastPkts }, (error, varbinds) => {
      if (error) {
        console.error("Error:", error);
      } else {
        varbinds.forEach((varbind) => {
          if (Object.keys(hosts_ant).length > 0) {
            const pktsRx =
              parseInt(varbind.value) -
              parseInt(hosts_ant[varbind.oid.slice(10).toString()]["rxPkts"]);
            hosts[varbind.oid.slice(10).toString()][
              "rxPkts"
            ] = `${pktsRx} Pkts`;
          } else {
            hosts[varbind.oid.slice(10).toString()][
              "rxPkts"
            ] = `${varbind.value} Pkts`;
          }
        });
      }
    });

    session.getSubtree({ oid: ifInOctets }, (error, varbinds) => {
      if (error) {
        console.error("Error:", error);
      } else {
        varbinds.forEach((varbind) => {
          if (Object.keys(hosts_ant).length > 0) {
            const BytesRx =
              parseInt(varbind.value) -
              parseInt(
                hosts_ant[varbind.oid.slice(10).toString()]["receivedBytes"]
              );
            console.log(BytesRx);
            hosts[varbind.oid.slice(10).toString()][
              "receivedBytes"
            ] = `${BytesRx} bytes`;
          } else {
            hosts[varbind.oid.slice(10).toString()][
              "receivedBytes"
            ] = `${varbind.value} bytes`;
          }
        });
      }
    });

    session.getSubtree({ oid: ifPhysAddressOID }, (error, varbinds) => {
      if (error) {
        console.error("Error:", error);
      } else {
        varbinds.forEach((varbind) => {
          hosts[varbind.oid.slice(10).toString()]["mac"] =
            varbind.valueHex != ""
              ? varbind.valueHex.match(/../g).join(":")
              : varbind.valueHex;
        });
      }
    });

    session.getSubtree({ oid: ifSpeedOID }, (error, varbinds) => {
      if (error) {
        console.error("Error:", error);
      } else {
        varbinds.forEach((varbind) => {
          hosts[varbind.oid.slice(10).toString()][
            "speed"
          ] = `${varbind.value} bits/s`;
        });
      }
    });

    session.getSubtree({ oid: ifType }, (error, varbinds) => {
      if (error) {
        console.error("Error:", error);
      } else {
        varbinds.forEach((varbind) => {
          const fechayhora = fechaActual.toLocaleString().split(",");
          const fecha = fechayhora[0];
          const hora = fechayhora[1];
          hosts[varbind.oid.slice(10).toString()]["type"] = varbind.value;
          hosts[varbind.oid.slice(10).toString()]["date"] = fechaActual;
          hosts[varbind.oid.slice(10).toString()]["hour"] = hora;

          const model = new infoHost(hosts[varbind.oid.slice(10).toString()]);
          // console.log(hosts[varbind.oid.slice(10).toString()]);

          if (Object.keys(hosts_ant).length > 0) {
            console.log("guardando....");
            model.save();

            const io = getIO();
            io.emit("nuevoRegistro", "ScanAP");
          }
        });
      }

      // Cierra la sesión SNMP
      console.log(hosts);

      // Actualizar hosts_ant con la información actual
      if (Object.keys(hosts_ant).length > 0) {
        Object.keys(hosts_ant).forEach((key) => delete hosts_ant[key]);
      } else {
        Object.assign(hosts_ant, hosts);
      }

      session.close();

      
    });

    // if(process.env.STOPSCRIPTS === true){
    //   console.log("Cerradoooooooooooooo");
    //   process.exit(1);
    // }
  }, 10000);

  // if(process.env.STOPSCRIPTS === true){
  //   return;
  // }
};

module.exports = ejecutarScriptAP;
