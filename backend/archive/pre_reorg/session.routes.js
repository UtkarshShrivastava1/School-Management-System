const express = require("express");
const router = express.Router();
const { requireAdmin } = require("../middleware/auth");
const ctrl = require("../controllers/session.controller");

router.post("/sessions", requireAdmin, ctrl.createSession);
router.get("/sessions/active", requireAdmin, ctrl.getActive);
router.get("/sessions", requireAdmin, ctrl.listSessions);

module.exports = router;
