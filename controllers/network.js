const { response } = require("express");
const hostNmap = require("../models/hostNmap");
const QualityOfService = require("../models/QualityOfService");
const infoAP = require("../models/infoAP");
const infoHost = require("../models/infoHost");

const getPorts = async (req, res = response) => {
  try {
    // Obtener todos los registros ordenados por fecha en orden descendente
    const registros = await hostNmap.find().select("mac ip ports date").sort({ date: -1 });

    if (!registros || registros.length === 0) {
      return res.status(404).json({
        ok: false,
        message: "No se encontraron registros en la base de datos.",
      });
    }

    // Obtener la última fecha 
    const ultimaFechaStr = registros[0].date;
    const ultimaFecha = new Date(ultimaFechaStr);

    const registrosUltimaFecha = registros.filter(registro => registro.date === ultimaFechaStr);

    const resp = registrosUltimaFecha.map(registro => {
      const nuevoFormatoPorts = (registro.ports && Array.isArray(registro.ports)) ? registro.ports.map(port => ({
        protocol: port._attributes.protocol,
        portid: port._attributes.portid,
        state: port.state?._attributes?.state,
        name: port.service?._attributes?.name,
      })) : [];

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
  const registros = await QualityOfService.find().select("mac TX RX").sort({ date: -1 }).limit(10);
  // console.log(registros)
  registrosfiltrados = [];

  console.log(registrosfiltrados);

  registros.map((data1) => {
    if (registrosfiltrados.length >= 1) {
      const valorExiste = registrosfiltrados.some(objeto => objeto['mac'] === data1.mac);
      if(!valorExiste){
        registrosfiltrados.push({mac: data1.mac, TX: data1.TX, RX: data1.RX})
        // console.log(data1.mac);
      }
    } else {
      registrosfiltrados.push({mac: data1.mac, TX: data1.TX, RX: data1.RX});
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

  const registros = await infoAP.find().select("interface date txPkts").sort({ date: -1 });

  try {
    const registrosConFechAndNumTxPkts = registros.map(registro => ({
      ...registro,
      date: typeof registro.date === 'string' ? new Date(registro.date.split("/").reverse().join("-")) : registro.date,
      txPkts: typeof registro.txPkts === 'string' ? parseInt(registro.txPkts, 10) : registro.txPkts,
      interface: registro.interface
    }));

    const sumaPorInterfaceFecha = {};

    registrosConFechAndNumTxPkts.forEach(registro => {
      const interfaceName = registro.interface;
      const fecha = registro.date.toISOString().split('T')[0];

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
      const data = Object.entries(sumaPorInterfaceFecha[interfaceName]).map(([fecha, totalTxPkts]) => ({
        x: fecha,
        y: totalTxPkts,
      }));

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

const getStateInterfaces = async (req, res = response) => {
  const registros = await infoAP.find().select("interface estado hour").sort({ date: -1 }).limit(10);

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

const getInfoDevices = async (req, res = response) => {
  const registro1 = await infoHost
    .find()
    .select("ip mac latencia date")
    .sort({ date: -1 })
    .limit(10);
  const registro2 = await QualityOfService.find()
    .select("mac rssi SNR RX TX")
    .sort({ date: -1 })
    .limit(10);

  //  console.log(registro2);
  const registros = [];
  let id = 1;
  registro1.map((data) => {
    registro2.map((data2) => {
      if (data.mac.toLowerCase() === data2.mac.toLowerCase()) {
        if (registros.length >= 1) {
          for (const objeto of registros) {
            if (objeto.mac != data.mac) {
              console.log(objeto.mac);
              registros.push({
                id: id++,
                mac: data.mac,
                ip: data.ip,
                latencia: data.latencia,
                date: data.date,
                rssi: data2.rssi,
                SNR: data2.SNR,
                RX: data2.RX,
                TX: data2.TX,
              });
            }
          }
        } else {
          registros.push({
            id: id++,
            mac: data.mac,
            ip: data.ip,
            latencia: data.latencia,
            date: data.date,
            rssi: data2.rssi,
            SNR: data2.SNR,
            RX: data2.RX,
            TX: data2.TX,
          });
        }
      }
    });
  });

  try {
    res.status(201).json({ registros });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: "Ha ocurrido un error en el servidor",
    });
  }
};

const getTraffic = async (req, res = response) => {
  const registros = await infoAP.find().select("interface date transmittedBytes receivedBytes").sort({ date: -1 });

  try {
    const registrosNuevo = registros.map(registro => ({
      ...registro,
      date: typeof registro.date === 'string' ? new Date(registro.date.split("/").reverse().join("-")) : registro.date,
      transmittedBytes: typeof registro.transmittedBytes === 'string' ? parseInt(registro.transmittedBytes, 10) : registro.transmittedBytes,
      receivedBytes: typeof registro.receivedBytes === 'string' ? parseInt(registro.receivedBytes, 10) : registro.receivedBytes,
      interface: registro.interface
    }));

    const sumaTransmittedBytesPorFecha = {};
    const sumaReceivedBytesPorFecha = {};

    registrosNuevo.forEach(registro => {
      const fecha = registro.date.toISOString().split('T')[0];

      if (!sumaTransmittedBytesPorFecha[fecha]) {
        sumaTransmittedBytesPorFecha[fecha] = 0;
      }

      if (!sumaReceivedBytesPorFecha[fecha]) {
        sumaReceivedBytesPorFecha[fecha] = 0;
      }

      sumaTransmittedBytesPorFecha[fecha] += registro.transmittedBytes;
      sumaReceivedBytesPorFecha[fecha] += registro.receivedBytes;
    });

    const resultadoFinal = [];

    const dataTx = Object.entries(sumaTransmittedBytesPorFecha).map(([fecha, totalTransmittedBytes]) => ({
      x: fecha,
      y: totalTransmittedBytes,
    }));

    const dataRx = Object.entries(sumaReceivedBytesPorFecha).map(([fecha, totalReceivedBytes]) => ({
      x: fecha,
      y: totalReceivedBytes,
    }));

    resultadoFinal.push({
      id: "TX Data",
      data: dataTx,
    });

    resultadoFinal.push({
      id: "RX Data",
      data: dataRx,
    });

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



module.exports = {
  getTxRxByMac,
  getPktsByInterface,
  getStateInterfaces,
  getInfoDevices,
  getTraffic,
  getPorts
};
