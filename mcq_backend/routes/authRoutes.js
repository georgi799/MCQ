const express = require("express");
const { register, login } = require("../controllers/authControllers");
const router = express.Router();
const verifyToken = require("../middleware/verifyToken");
const authorizeRoles = require("../middleware/authorizeRoles");

router.post("/register", register);
router.post("/login", login);

router.get('/professor/dashboard', verifyToken, authorizeRoles('professor'), (req, res) => {
    res.json({message: `Welcome Professor ${req.user.username}!`})
});

module.exports = router;