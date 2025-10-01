const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");

// ROUTE 1: Create a new user
router.post(
  "/createuser",
  [
    body("name", "Enter a valid name").isLength({ min: 3 }),
    body("email", "Enter a valid email").isEmail(),
    body("password", "Password must be at least 5 characters").isLength({ min: 5 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const secPass = await bcrypt.hash(req.body.password, salt);

      // Create user
      const user = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: secPass,
      });

      // Generate JWT
      const data = { user: { id: user.id } };
      const authToken = jwt.sign(data, process.env.JWT_SECRET);

      res.json({ authToken });
    } catch (err) {
      console.error(err.message); 
      return res.status(500).send("Server Error");
    }
  }
);

// ROUTE 2: Login user
router.post(
  "/login",
  [
    body("email", "Enter a valid email").isEmail(),
    body("password", "Password cannot be blank").exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    try {
      let user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ errors: "Invalid credentials" });
      }

      const passwordCompare = await bcrypt.compare(password, user.password);
      if (!passwordCompare) {
        return res.status(400).json({ errors: "Invalid credentials" });
      }

      // Generate JWT
      const data = { user: { id: user.id } };
      const authToken = jwt.sign(data, process.env.JWT_SECRET);

      res.json({ authToken });
    } catch (err) {
      console.error(err.message);
      return res.status(500).send("Server Error");
    }
  }
);

module.exports = router;
