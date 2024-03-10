const express = require('express');
const router = express.Router();
const controller = require("../controller/controller");
const authController = require("../controller/authController");
router.route("/").get(authController.protect,authController.restrict('admin','guide-leader'),controller.show);

module.exports = router;
