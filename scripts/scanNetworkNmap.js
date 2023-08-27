const { exec } = require("child_process");
const { xml2json } = require("xml-js");
const fs = require("fs");
const hostNmap = require('../models/hostNmap');
const moment = require('moment-timezone');
const { connectionDB } = require("../db/config");

// connectionDB();

const ejecutarScriptNmap = () => {
  moment.tz.setDefault('America/Guayaquil');

function scanNetwork() {
  exec(
    "nmap -F -oX resultado.xml 192.168.65.0/24",
    async (error) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return;
      }
      const xml = fs.readFileSync("./resultado.xml", "utf8");
      const options = {
        compact: true,
        ignoreDeclaration: true,
        ignoreInstruction: true,
        spaces: 4,
      };
      const json = JSON.parse(xml2json(xml, options));
      const jsonStr = JSON.stringify(json);
      const { nmaprun } = JSON.parse(jsonStr);
      const { host, runstats } = nmaprun; 
      const horaActual = moment().toDate();
      host.forEach(async element => {
        if(element.address.length  >= 1) {
          const host1 = new hostNmap({
            date: horaActual,
            status: element.status._attributes.state,
            mac: element.address[1]._attributes.addr,
            ip: element.address[0]._attributes.addr,
            ports: (Object.keys(element.ports).length > 1) ? element.ports.port: null,
            rttvar: element.times._attributes.rttvar,
            srtt: element.times._attributes.srtt,
            to: element.times._attributes.to
          });
          await host1.save();
        }
      });
      scanNetwork();
    }
  );
}
scanNetwork();

}

module.exports = ejecutarScriptNmap;



// const xml = fs.readFileSync("./resultado.xml", "utf8");
// const options = {
//   compact: true,
//   ignoreDeclaration: true,
//   ignoreInstruction: true,
//   spaces: 4,
// };
// const json = JSON.parse(xml2json(xml, options));
// const jsonStr = JSON.stringify(json);
// const { nmaprun } = JSON.parse(jsonStr);
// const { host, runstats } = nmaprun; 
// const horaActual = moment().toDate();

// console.log(host);
// // host.forEach(async element => {
// //   if(element.address.length  >= 1) {
// //     const host1 = new hostNmap({
// //       // date: runstats.finished._attributes.timestr,
// //       date: horaActual,
// //       status: element.status._attributes.state,
// //       mac: element.address[1]._attributes.addr,
// //       ip: element.address[0]._attributes.addr,
// //       ports: (Object.keys(element.ports).length > 1) ? element.ports.port: null,
// //       rttvar: element.times._attributes.rttvar,
// //       srtt: element.times._attributes.srtt,
// //       to: element.times._attributes.to
// //     });
// //     console.log("Antes de guardar!!!");
// //     await host1.save();

// //   }
// // });

