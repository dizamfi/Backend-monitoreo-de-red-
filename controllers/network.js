const { response } = require("express");
const hostNmap = require("../models/hostNmap");
const QualityOfService = require("../models/QualityOfService");
const infoAP = require("../models/infoAP");
const infoHost = require("../models/infoHost");
const ejecutarScriptAP = require("../scripts/scanAP");
const ejecutarScriptSnmp = require("../scripts/scanNetworkSnmp");
const ejecutarScriptQualityOfServices = require("../scripts/scanQualityOfService");
const { format, subHours } = require("date-fns");
const { utcToZonedTime } = require("date-fns-tz");
const ping = require("ping");

const getPorts = async (req, res = response) => {
  try {
    // Obtener todos los registros ordenados por fecha en orden descendente
    const registros = await hostNmap
      .find()
      .select("mac ip ports date")
      .sort({ date: -1 });

    if (!registros || registros.length === 0) {
      return res.status(404).json({
        ok: false,
        message: "No se encontraron registros en la base de datos.",
      });
    }

    // Obtener la última fecha
    const ultimaFechaStr = registros[0].date;
    const ultimaFecha = new Date(ultimaFechaStr);

    const registrosUltimaFecha = registros.filter(
      (registro) => registro.date === ultimaFechaStr
    );

    const resp = registrosUltimaFecha.map((registro) => {
      const nuevoFormatoPorts =
        registro.ports && Array.isArray(registro.ports)
          ? registro.ports.map((port) => ({
              protocol: port._attributes.protocol,
              portid: port._attributes.portid,
              state: port.state?._attributes?.state,
              name: port.service?._attributes?.name,
            }))
          : [];

      return {
        _id: registro._id,
        date: registro.date,
        mac: registro.mac,
        ip: registro.ip,
        ports: nuevoFormatoPorts,
      };
    });

    res.status(201).json({
      ok: true,
      resp,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      ok: false,
      message: "Ha ocurrido un error en el servidor",
    });
  }
};

const getTxRxByMac = async (req, res = response) => {
  const registros = await QualityOfService.find()
    .select("mac TX RX date hour")
    .sort({ date: -1, hour: -1 })
    .limit(15);
  // console.log(registros)
  registrosfiltrados = [];

  console.log(registros);

  registros.map((data1) => {
    if (registrosfiltrados.length >= 1) {
      const valorExiste = registrosfiltrados.some(
        (objeto) => objeto["mac"] === data1.mac
      );
      if (!valorExiste) {
        registrosfiltrados.push({ mac: data1.mac, TX: data1.TX, RX: data1.RX });
        // console.log(data1.mac);
      }
    } else {
      registrosfiltrados.push({ mac: data1.mac, TX: data1.TX, RX: data1.RX });
      // console.log(data1.mac);
    }
  });

  try {
    res.status(201).json({ registrosfiltrados });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: "Ha ocurrido un error en el servidor",
    });
  }
};

const getPktsByInterface = async (req, res = response) => {
  try {
    const registros = await infoAP
      .find()
      .select("interface date txPkts")
      .lean(); // Utilizamos .lean() para obtener un objeto JSON plano en lugar de un objeto mongoose.

    const registrosConFechAndNumTxPkts = registros.map((registro) => ({
      ...registro,
      date:
        typeof registro.date === "string"
          ? new Date(registro.date.split("/").reverse().join("-"))
          : registro.date,
      txPkts:
        typeof registro.txPkts === "string"
          ? parseInt(registro.txPkts, 10)
          : registro.txPkts,
      interface: registro.interface,
    }));

    const registrosOrdenados = registrosConFechAndNumTxPkts.sort(
      (a, b) => a.date - b.date
    );

    // Filtramos los registros para obtener solo los de las 5 últimas fechas
    const ultimasFechas = [
      ...new Set(
        registrosOrdenados.map((r) => r.date.toISOString().split("T")[0])
      ),
    ]
      .slice(-5)
      .sort();

    const registrosFiltrados = registrosOrdenados.filter((r) =>
      ultimasFechas.includes(r.date.toISOString().split("T")[0])
    );

    const sumaPorInterfaceFecha = {};

    registrosFiltrados.forEach((registro) => {
      const interfaceName = registro.interface;
      const fecha = registro.date.toISOString().split("T")[0];

      if (!sumaPorInterfaceFecha[interfaceName]) {
        sumaPorInterfaceFecha[interfaceName] = {};
      }

      if (!sumaPorInterfaceFecha[interfaceName][fecha]) {
        sumaPorInterfaceFecha[interfaceName][fecha] = 0;
      }

      sumaPorInterfaceFecha[interfaceName][fecha] += registro.txPkts;
    });

    const resultadoFinal = [];

    for (const interfaceName in sumaPorInterfaceFecha) {
      const data = Object.entries(sumaPorInterfaceFecha[interfaceName]).map(
        ([fecha, totalTxPkts]) => ({
          x: fecha,
          y: totalTxPkts,
        })
      );

      resultadoFinal.push({
        id: interfaceName,
        data,
      });
    }

    res.status(201).json({
      ok: true,
      registrosPorInterface: resultadoFinal,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: "Ha ocurrido un error en el servidor",
    });
  }
};

// const getPktsByInterface = async (req, res = response) => {
//   try {
//     const registros = await infoAP
//       .find()
//       .select("interface date txPkts")
//       .lean();

//     const registrosConFechAndNumTxPkts = registros.map((registro) => ({
//       ...registro,
//       date:
//         typeof registro.date === "string"
//           ? new Date(registro.date.split("/").reverse().join("-"))
//           : registro.date,
//       txPkts:
//         typeof registro.txPkts === "string"
//           ? parseInt(registro.txPkts, 10)
//           : registro.txPkts,
//       interface: registro.interface,
//     }));

//     const registrosOrdenados = registrosConFechAndNumTxPkts.sort(
//       (a, b) => a.date - b.date
//     );

//     const ultimaFecha = new Date(); // Fecha actual
//     ultimaFecha.setHours(ultimaFecha.getHours() - 5);

//     const registrosFiltrados = registrosOrdenados.filter(
//       (r) => r.date >= ultimaFecha
//     );

//     const sumaPorInterfaceHora = {};

//     registrosFiltrados.forEach((registro) => {
//       const interfaceName = registro.interface;
//       const hora = registro.date
//         .toLocaleString("es-EC", {
//           timeZone: "America/Guayaquil", // Zona horaria de Ecuador
//           hour: "numeric",
//         })
//         .padStart(2, "0"); // Formatear la hora a dos dígitos

//       if (!sumaPorInterfaceHora[interfaceName]) {
//         sumaPorInterfaceHora[interfaceName] = {};
//       }

//       if (!sumaPorInterfaceHora[interfaceName][hora]) {
//         sumaPorInterfaceHora[interfaceName][hora] = 0;
//       }

//       sumaPorInterfaceHora[interfaceName][hora] += registro.txPkts;
//     });

//     const resultadoFinal = [];

//     for (const interfaceName in sumaPorInterfaceHora) {
//       const data = Object.entries(sumaPorInterfaceHora[interfaceName])
//         .map(([hora, totalTxPkts]) => ({
//           x: `${hora}:00:00`, // Formato hh:00:00
//           y: totalTxPkts,
//         }))
//         .sort((a, b) => {
//           // Ordenar en forma ascendente por la propiedad "x"
//           return new Date(`1970-01-01T${a.x}`).getTime() - new Date(`1970-01-01T${b.x}`).getTime();
//         });

//       resultadoFinal.push({
//         id: interfaceName,
//         data,
//       });
//     }

//     res.status(201).json({
//       ok: true,
//       registrosPorInterface: resultadoFinal,
//     });
//   } catch (error) {
//     res.status(500).json({
//       ok: false,
//       message: "Ha ocurrido un error en el servidor",
//     });
//   }
// };

const getPktsTotalWithSnmp = async (req, res = response) => {
  try {
    const registros = await infoAP
      .find()
      .select("date txPkts rxPkts hour")
      .sort({ date: -1, hour: -1 });

    const registrosConFechaAndNumPkts = registros.map((registro) => ({
      ...registro,
      date: new Date(registro.date),
      txPkts:
        typeof registro.txPkts === "string"
          ? parseInt(registro.txPkts, 10)
          : registro.txPkts,
      rxPkts:
        typeof registro.rxPkts === "string"
          ? parseInt(registro.rxPkts, 10)
          : registro.rxPkts,
    }));

    const sumaPorFechaYHoraTx = {};
    const sumaPorFechaYHoraRx = {};

    registrosConFechaAndNumPkts.forEach((registro) => {
      const fechaHora = registro.date.toISOString().split("T");
      const fecha = fechaHora[0];
      const horaUTC = fechaHora[1].split(":")[0];

      const ecuadorOffset = -5;
      const horaEcuador = (parseInt(horaUTC) + ecuadorOffset + 24) % 24;
      console.log(horaEcuador);

      if (!sumaPorFechaYHoraTx[fecha]) {
        sumaPorFechaYHoraTx[fecha] = {};
      }
      if (!sumaPorFechaYHoraRx[fecha]) {
        sumaPorFechaYHoraRx[fecha] = {};
      }

      if (!sumaPorFechaYHoraTx[fecha][horaEcuador]) {
        sumaPorFechaYHoraTx[fecha][horaEcuador] = 0;
      }
      if (!sumaPorFechaYHoraRx[fecha][horaEcuador]) {
        sumaPorFechaYHoraRx[fecha][horaEcuador] = 0;
      }

      sumaPorFechaYHoraTx[fecha][horaEcuador] += registro.txPkts;
      sumaPorFechaYHoraRx[fecha][horaEcuador] += registro.rxPkts;
    });

    const resultadoFinalTx = [];
    const resultadoFinalRx = [];

    const ultimaFecha = Object.keys(sumaPorFechaYHoraTx).sort().pop();

    const ultimasHoras = Object.keys(sumaPorFechaYHoraTx[ultimaFecha])
      .sort()
      .slice(-5);
    console.log(ultimaFecha);

    ultimasHoras.forEach((horaEcuador) => {
      const txPktsValue = sumaPorFechaYHoraTx[ultimaFecha][horaEcuador] / 1000;
      const rxPktsValue = sumaPorFechaYHoraRx[ultimaFecha][horaEcuador] / 1000;

      resultadoFinalTx.push({
        x: `${horaEcuador}:00:00`,
        y: `${isNaN(txPktsValue) ? "0.00" : txPktsValue.toFixed(2)} k`,
      });
      resultadoFinalRx.push({
        x: `${horaEcuador}:00:00`,
        y: `${isNaN(rxPktsValue) ? "0.00" : rxPktsValue.toFixed(2)} k`,
      });
    });

    const pktsTransmitted = [
      {
        id: "txPkts",
        data: resultadoFinalTx,
      },
      {
        id: "rxPkts",
        data: resultadoFinalRx,
      },
    ];

    res.status(201).json({
      ok: true,
      pktstransmited: pktsTransmitted,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: "Ha ocurrido un error en el servidor",
    });
  }
};

const getPktsWithSSH = async (req, res = response) => {
  try {
    const registros = await QualityOfService.find()
      .select("date TX_Pkts RX_Pkts hour")
      .sort({ date: -1, hour: -1 })
      .limit(1);

    if (registros.length === 0) {
      return res.status(404).json({
        ok: false,
        message: "No se encontraron registros en la base de datos",
      });
    }

    const lastRecord = registros[0];
    const lastDate = new Date(`${lastRecord.date} ${lastRecord.hour}`);

    const responseArray = [];

    for (let i = 0; i < 5; i++) {
      const currentHour = new Date(lastDate);
      currentHour.setHours(lastDate.getHours() - i);

      const hourQuery = currentHour.getHours().toString().padStart(2, "0");
      const recordsForHour = await QualityOfService.find({
        date: lastRecord.date,
        hour: hourQuery,
      });

      const txPktsTotal = recordsForHour.reduce(
        (total, record) => total + record.TX_Pkts,
        0
      );
      const rxPktsTotal = recordsForHour.reduce(
        (total, record) => total + record.RX_Pkts,
        0
      );

      responseArray.push({
        id: "txPkts",
        data: responseArray.length === 0 ? [] : responseArray[0].data,
      });

      responseArray.push({
        id: "rxPkts",
        data: responseArray.length === 0 ? [] : responseArray[1].data,
      });

      responseArray[0].data.push({
        x: `${hourQuery}:00:00`,
        y: `${txPktsTotal.toFixed(2)} k`,
      });

      responseArray[1].data.push({
        x: `${hourQuery}:00:00`,
        y: `${rxPktsTotal.toFixed(2)} k`,
      });
    }

    res.status(201).json({
      ok: true,
      pktstransmited: responseArray,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: "Ha ocurrido un error en el servidor",
    });
  }
};

const getStateInterfaces = async (req, res = response) => {
  const registros = await infoAP
    .find()
    .select("interface estado hour")
    .sort({ date: -1 })
    .limit(10);

  try {
    res.status(201).json({
      registros,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: "Ha ocurrido un error en el servidor",
    });
  }
};

// const getInfoDevices = async (req, res = response) => {
//   try {
//     const registro1 = await infoHost
//       .find()
//       .select("ip mac latencia date")
//       .sort({ date: -1, hour: -1 })
//       .limit(10);
//     const registro2 = await QualityOfService.find()
//       .select("mac rssi SNR RX TX")
//       .sort({ date: -1, hour: -1 })
//       .limit(10);

//     const registros = [];
//     let id = 1;

//     registro1.forEach((data) => {
//       const matchingData2 = registro2.find(
//         (data2) => data.mac.toLowerCase() === data2.mac.toLowerCase()
//       );

//       console.log(registro1);

//       if (!registros.some((objeto) => objeto.mac === data.mac)) {
//         registros.push({
//           id: id++,
//           mac: data.mac,
//           ip: matchingData2 ? data.ip: null,
//           latencia: data.latencia,
//           date: data.date,
//           rssi: matchingData2 ? matchingData2.rssi : null,
//           SNR: matchingData2 ? matchingData2.SNR: null,
//           RX: matchingData2 ? matchingData2.RX : null,
//           TX: matchingData2 ? matchingData2.TX: null,
//         });
//       }
//     });

//     registro2.forEach((data) => {
//       const matchingData = registros.find(
//         (data2) => data.mac.toLowerCase() === data2.mac.toLowerCase() 
//       );

//       if(!matchingData){
//         registros.push({
//           id: id++,
//           mac: data.mac,
//           ip: null,
//           latencia: null,
//           date: data.date,
//           rssi: null,
//           SNR: null,
//           RX: null,
//           TX: null,
//         });
      
//       }

      
//     });

//     res.status(201).json({ registros });
//   } catch (error) {
//     res.status(500).json({
//       ok: false,
//       message: "Ha ocurrido un error en el servidor",
//     });
//   }
// };


const getInfoDevices = async (req, res = response) => {
  try {
    const registro1 = await infoHost
      .find()
      .select("ip mac latencia date")
      .sort({ date: -1, hour: -1 })
      .limit(10);
    const registro2 = await QualityOfService.find()
      .select("mac rssi SNR RX TX")
      .sort({ date: -1, hour: -1 })
      .limit(10);

    const registros = [];
    let id = 1;

    registro1.forEach((data) => {
      const matchingData2 = registro2.find(
        (data2) => data.mac.toLowerCase() === data2.mac.toLowerCase()
      );

      if (matchingData2) {
        if (!registros.some((objeto) => objeto.mac === data.mac)) {
          registros.push({
            id: id++,
            mac: data.mac,
            ip: data.ip,
            latencia: data.latencia,
            date: data.date,
            rssi: matchingData2.rssi,
            SNR: matchingData2.SNR,
            RX: matchingData2.RX,
            TX: matchingData2.TX,
          });
        }
      }
    });

    res.status(201).json({ registros });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: "Ha ocurrido un error en el servidor",
    });
  }
};

const getTraffic = async (req, res = response) => {
  try {
    const registros = await infoAP
      .find()
      .select("interface date transmittedBytes receivedBytes")
      .sort({ date: -1 });

    const registrosNuevo = registros.map((registro) => ({
      ...registro,
      date:
        typeof registro.date === "string"
          ? new Date(registro.date.split("/").reverse().join("-"))
          : registro.date,
      transmittedBytes:
        typeof registro.transmittedBytes === "string"
          ? parseInt(registro.transmittedBytes, 10)
          : registro.transmittedBytes,
      receivedBytes:
        typeof registro.receivedBytes === "string"
          ? parseInt(registro.receivedBytes, 10)
          : registro.receivedBytes,
      interface: registro.interface,
    }));

    const sumaTransmittedBytesPorFecha = {};
    const sumaReceivedBytesPorFecha = {};

    registrosNuevo.forEach((registro) => {
      const fecha = registro.date.toISOString().split("T")[0];

      if (!sumaTransmittedBytesPorFecha[fecha]) {
        sumaTransmittedBytesPorFecha[fecha] = 0;
      }

      if (!sumaReceivedBytesPorFecha[fecha]) {
        sumaReceivedBytesPorFecha[fecha] = 0;
      }

      sumaTransmittedBytesPorFecha[fecha] += registro.transmittedBytes;
      sumaReceivedBytesPorFecha[fecha] += registro.receivedBytes;
    });

    const dataTx = Object.entries(sumaTransmittedBytesPorFecha)
      .map(([fecha, totalTransmittedBytes]) => ({
        x: fecha,
        y: totalTransmittedBytes / 1000, // Dividir por mil
      }))
      .sort((a, b) => new Date(a.x) - new Date(b.x))
      .slice(-5); // Tomar las últimas 5 fechas

    const dataRx = Object.entries(sumaReceivedBytesPorFecha)
      .map(([fecha, totalReceivedBytes]) => ({
        x: fecha,
        y: totalReceivedBytes / 1000, // Dividir por mil
      }))
      .sort((a, b) => new Date(a.x) - new Date(b.x))
      .slice(-5); // Tomar las últimas 5 fechas

    const resultadoFinal = [
      {
        id: "TX Data",
        data: dataTx,
      },
      {
        id: "RX Data",
        data: dataRx,
      },
    ];

    res.status(201).json({
      ok: true,
      registrosPorInterface: resultadoFinal,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: "Ha ocurrido un error en el servidor",
    });
  }
};

const postEjecutarScripts = async (req, res = response) => {
  try {
    const { router, scanType } = req.body;

    const pingResult = await ping.promise.probe(router, {
      timeout: 1,
      min_reply: 2,
    });

    if (!pingResult.alive) {
      return res.status(400).json({
        ok: false,
        message: "La dirección IP del router no está en la misma red",
      });
    } else {  
      if (scanType === "SNMP") {
        await ejecutarScriptAP(router);
        await ejecutarScriptSnmp(router);
      } else if (scanType === "SSH") {
        await ejecutarScriptQualityOfServices(router);
      } else {
        await ejecutarScriptAP(router);
        await ejecutarScriptSnmp(router);
        await ejecutarScriptQualityOfServices(router);
      }

      res.json({
        ip: router,
        message: "Scripts ejecutados",
      });
    }
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: "Ha ocurrido un error en el servidor",
    });
  }
};

const postStopScripts = async (req, res = response) => {
  try {
    const { stop } = req.body;

    process.env.STOPSCRIPTS = stop;

    res.json({
      message: "Scripts detenidos",
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: "Ha ocurrido un error en el servidor",
    });
  }
};

const getFrecuencys = async (req, res = response) => {
  try {
    const registros = await QualityOfService.find()
      .select("frecuency mac")
      .sort({ date: -1, hour: -1 })
      .limit(10);

    // Crear un objeto para almacenar las frecuencias y sus totales
    const frecuenciaCantidad = {};

    // Contar la cantidad de dispositivos únicos por frecuencia
    registros.forEach((registro) => {
      const { mac, frecuency } = registro;
      if (!frecuenciaCantidad[frecuency]) {
        frecuenciaCantidad[frecuency] = {
          label: frecuency,
          value: 0,
          id: frecuency,
        };
      }
      if (!frecuenciaCantidad[frecuency][mac]) {
        frecuenciaCantidad[frecuency][mac] = true;
        frecuenciaCantidad[frecuency].value++;
      }
    });

    // Convertir el objeto en un arreglo de objetos sin las direcciones MAC
    const resultados = Object.values(frecuenciaCantidad).map(
      ({ label, value, id }) => ({ label, value, id })
    );

    res.json({
      resultados,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: "Ha ocurrido un error en el servidor",
    });
  }
};

const getDevicedConectedSnmp = async (req, res = response) => {
  try {
    const registros = await infoHost.find().select("date hour mac").lean();

    const registrosConFechAndMac = registros.map((registro) => ({
      ...registro,
      date:
        typeof registro.date === "string"
          ? new Date(registro.date.split("/").reverse().join("-"))
          : registro.date,
      hour: registro.hour,
      mac: registro.mac,
    }));

    const registrosOrdenados = registrosConFechAndMac.sort(
      (a, b) => b.date - a.date
    );

    const ultimaFecha = registrosOrdenados[0].date.toISOString().split("T")[0];
    const ultimaHora = registrosOrdenados[0].hour;

    const macsUltimaFechaHora = new Set(
      registrosOrdenados
        .filter(
          (registro) =>
            registro.date.toISOString().split("T")[0] === ultimaFecha &&
            registro.hour === ultimaHora
        )
        .map((registro) => registro.mac)
    );

    console.log(macsUltimaFechaHora);

    const cantidadMacs = macsUltimaFechaHora.size;

    res.status(200).json({
      ok: true,
      cantidadMacs: cantidadMacs,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: "Ha ocurrido un error en el servidor",
    });
  }
};

const getDevicedConectedSSH = async (req, res = response) => {
  try {
    const registros = await QualityOfService.find()
      .select("date hour mac")
      .lean();

    const registrosConFechAndMac = registros.map((registro) => ({
      ...registro,
      date:
        typeof registro.date === "string"
          ? new Date(registro.date.split(".").reverse().join("-"))
          : registro.date,
      hour: registro.hour,
      mac: registro.mac,
    }));

    const registrosOrdenados = registrosConFechAndMac.sort(
      (a, b) => b.date - a.date
    );

    const ultimaFecha = registrosOrdenados[0].date.toISOString().split("T")[0];
    const ultimaHora = registrosOrdenados[0].hour;

    const macsUltimaFechaHora = new Set(
      registrosOrdenados
        .filter(
          (registro) =>
            registro.date.toISOString().split("T")[0] === ultimaFecha &&
            registro.hour === ultimaHora
        )
        .map((registro) => registro.mac)
    );

    const cantidadMacs = macsUltimaFechaHora.size;

    res.status(200).json({
      ok: true,
      cantidadMacs: cantidadMacs,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: "Ha ocurrido un error en el servidor",
    });
  }
};

module.exports = {
  getTxRxByMac,
  getPktsByInterface,
  getStateInterfaces,
  getInfoDevices,
  getTraffic,
  getPorts,
  postEjecutarScripts,
  postStopScripts,
  getFrecuencys,
  getPktsTotalWithSnmp,
  getPktsWithSSH,
  getDevicedConectedSnmp,
  getDevicedConectedSSH,
};
