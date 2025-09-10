// routes/academic/classOverview.routes.js
const router = require("express").Router();
const ctrl = require("../../controllers/classOverview.controller");
const { requireAdmin } = require("../../middleware/auth");

router.get("/classes/overview", requireAdmin, ctrl.getOverview);
module.exports = router;
