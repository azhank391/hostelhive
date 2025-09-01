const express = require("express");
const router = express.Router();
const { Hostel } = require("../models");
const { verifyToken } = require("../middleware/authMiddleware");

// Get all hostels for the authenticated user (hostel owner)
router.get("/hostels", verifyToken, async (req, res) => {
  try {

    if (req.user.role !== "owner") {
      return res
        .status(403)
        .json({
          message: "Access denied. Only hostel owners can access this.",
        });
    }

    console.log('✅ DEBUG: User is owner, proceeding with query');
    
    const hostels = await Hostel.findAll({
      where: { ownerId: req.user.id },
      attributes: [
        "id",
        "name",
        "subdomain",
        "isActive",
        "plan",
        "email",
        "isPaid",
        "ownerId", // Add this to include ownerId in response
      ],
      order: [["name", "ASC"]],
    });

    console.log('✅ DEBUG: Database query successful, hostels found:', hostels.length);
    res.json(hostels);
  } catch (error) {
    console.error("❌ Error fetching owner hostels:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Resolve hostel by subdomain
router.get("/resolve/:subdomain", async (req, res) => {
  try {
    const { subdomain } = req.params;

    if (!subdomain || typeof subdomain !== "string") {
      return res.status(400).json({ message: "Invalid subdomain" });
    }

    const hostel = await Hostel.findOne({
      where: {
        subdomain: subdomain.toLowerCase(),
        isActive: true,
      },
      attributes: ["id", "name", "subdomain", "isActive", "plan", "email"],
    });

    if (!hostel) {
      return res.status(404).json({ message: "Hostel not found" });
    }

    res.json(hostel);
  } catch (error) {
    console.error("Error resolving hostel by subdomain:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get hostel context for authenticated user
router.get("/context", verifyToken, async (req, res) => {
  try {
    let hostel = null;

    // If user is owner, get hostels they own
    if (req.user.role === "owner") {
      const hostels = await Hostel.findAll({
        where: { ownerId: req.user.id },
        attributes: [
          "id",
          "name",
          "subdomain",
          "isActive",
          "plan",
          "email",
          "isPaid",
        ],
        order: [["name", "ASC"]],
      });

      return res.json({
        type: "owner",
        hostels,
        canManageMultiple: hostels.length > 1,
      });
    }

    // If user is admin/student, get their associated hostel
    if (req.user.hostelId) {
      hostel = await Hostel.findByPk(req.user.hostelId, {
        attributes: ["id", "name", "subdomain", "isActive", "plan", "email"],
      });
    }

    res.json({
      type: "user",
      hostel,
      canManageMultiple: false,
    });
  } catch (error) {
    console.error("Error fetching hostel context:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
