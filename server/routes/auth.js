const express = require("express");
const router = express.Router();
const {
  registerOwner,
  registerUser,
  loginUser,
  getCurrentUser,
  getUserHostels,
  getAllOwnerHostels,
  setActiveHostel,
  updateProfile,
  changePassword,
} = require("../controllers/authController");
const { verifyToken, requireAuth } = require("../middleware/authMiddleware");
const User = require("../models/user");

// Public endpoints
router.post("/register-owner", registerOwner);
router.post("/register-user", verifyToken, registerUser);
router.post("/login", loginUser);

// Protected endpoints
router.get("/hostels", verifyToken, getUserHostels);
router.get("/hostels/all", verifyToken, getAllOwnerHostels); // For owner dashboard
router.post("/set-active-hostel", verifyToken, setActiveHostel);

// Profile update endpoint
router.put("/profile", verifyToken, requireAuth, updateProfile);

// Password change endpoint
router.put("/change-password", verifyToken, requireAuth, changePassword);

module.exports = router;

module.exports = router;
