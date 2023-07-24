const { Router } = require("express");
const { getPorts, getTxRxByMac, getPktsByInterface, getStateInterfaces, getInfoDevices, getTraffic } = require("../controllers/network");
const router = Router();

router.get("/ports", getPorts);

router.get("/txrxbymac", getTxRxByMac);

router.get("/pktsbyinterface", getPktsByInterface);

router.get("/stateInterfaces", getStateInterfaces);

router.get("/infoDevices", getInfoDevices);

router.get("/traffic", getTraffic);

module.exports = router;

