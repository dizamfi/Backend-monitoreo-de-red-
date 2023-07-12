const { Router } = require("express");
const router = Router();
const { portinfo } = require("../controllers/ports.controller");
router.get('/', portinfo);

module.exports = router;