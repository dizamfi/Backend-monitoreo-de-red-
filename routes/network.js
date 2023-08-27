const { Router } = require("express");
const { getPorts, getTxRxByMac, getPktsByInterface, getStateInterfaces, getInfoDevices, getTraffic, postEjecutarScripts, postStopScripts, getFrecuencys, getPktsTotal, getPktsTotalWithSnmp, getPktsWithSSH } = require("../controllers/network");
const router = Router();

router.get("/ports", getPorts);

router.get("/txrxbymac", getTxRxByMac);

router.get("/pktsbyinterface", getPktsByInterface);

router.get("/pktstotalWithSnmp", getPktsTotalWithSnmp);

router.get("/pktstotalWithSSH", getPktsWithSSH);

router.get("/stateInterfaces", getStateInterfaces);

router.get("/infoDevices", getInfoDevices);

router.get("/traffic", getTraffic);

router.get("/frecuency", getFrecuencys);

router.post("/ejecutarScripts", postEjecutarScripts );

router.post("/stopScripts", postStopScripts );

module.exports = router;

