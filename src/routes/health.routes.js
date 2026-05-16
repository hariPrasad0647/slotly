
const express = require("express");

const {
  healthController,
} = require("../controllers/health/health.controller");

const router = express.Router();

router.get("/", healthController);

module.exports = router;
