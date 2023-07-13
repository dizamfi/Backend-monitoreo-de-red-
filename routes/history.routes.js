const { Router } = require("express");
const router = Router();
const { historial } = require("../controllers/history.controller");
router.get('/', historial);

module.exports = router;