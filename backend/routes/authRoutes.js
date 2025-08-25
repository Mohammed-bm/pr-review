const express = require("express");
const { check } = require("express-validator");
const { registerUser, loginUser } = require("../controllers/authController");

const router = express.Router();

router.post(
  "/register",
  [
    check("email", "Please include a valid email").isEmail(),
    check("password", "Password must be 6+ chars").isLength({ min: 6 }),
  ],
  registerUser
);

router.post("/login", loginUser);

module.exports = router;
