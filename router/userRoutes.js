const express = require("express");
// const userController = require("../controller/")
const authController = require("../controller/authController");

const router = express.Router();

router.route("/api/signup").post(authController.signup);
router.route("/api/login").post(authController.login);
router.route("/api/forgetPassword").post(authController.forgetPassword);
router.route("/api/resetPassword/:token").patch(authController.resetPassword);

module.exports=router;