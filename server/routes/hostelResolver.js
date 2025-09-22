const express = require("express");
const router = express.Router();
const { Hostel, User } = require("../models");
const { verifyToken } = require("../middleware/authMiddleware");
const { 
  requirePermission
} = require("../middleware/permissionMiddleware");

/**
 * Get hostel by subdomain (public endpoint for frontend)
 * Used by frontend to resolve hostel context from subdomain
 */
router.get("/by-subdomain/:subdomain", async (req, res) => {
  try {
    const { subdomain } = req.params;

    if (!subdomain || subdomain.length > 50) {
      return res.status(400).json({ message: "Invalid subdomain" });
    }

    const hostel = await Hostel.findOne({
      where: {
        subdomain: subdomain.toLowerCase(),
        isActive: true,
      },
  attributes: ["id", "name", "subdomain", "plan_id", "isActive"],
    });

    if (!hostel) {
      return res.status(404).json({
        message: "Hostel not found",
        subdomain,
      });
    }

    res.json(hostel);
  } catch (error) {
    console.error("Error fetching hostel by subdomain:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * Get all hostels owned by the authenticated owner
 * Used for multi-hostel owner dropdown
 */
router.get("/hostels", verifyToken, requirePermission('hostel_read'), async (req, res) => {
  try {
    // Find all hostels where the owner is associated
    const hostels = await Hostel.findAll({
      include: [
        {
          model: User,
          where: {
            id: req.user.id,
            role: "owner",
          },
          attributes: [],
        },
      ],
  attributes: ["id", "name", "subdomain", "isActive", "plan_id"],
      where: { isActive: true },
      order: [["name", "ASC"]],
    });

    res.json(hostels);
  } catch (error) {
    console.error("Error fetching owner hostels:", error);
    res.status(500).json({ message: "Failed to fetch hostels" });
  }
});

module.exports = router;
