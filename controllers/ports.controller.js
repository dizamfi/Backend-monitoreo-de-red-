const Port = require("../models/hostnmaps.ports");
const portinfo = async (req, res) => {
  let response = [];
  const filteredports = await Port.find({});
  try {
    filteredports.forEach((element) => {
      const validator = element.ports ?? [];
      validator.forEach((p) => {
        response.push({
          mac: element.mac,
          date: element.date,
          id: element._id,
          ip: element.ip,
          status: p.state,
          service: p.service,
        });
        //console.log(p)
      });
      //console.log(element.ports)
    });
  } catch (e) {
    console.log(e);
  }
  return res.status(200).json(response);
};
exports.portinfo = portinfo;
