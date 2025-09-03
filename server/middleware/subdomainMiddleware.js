const { Hostel } = require("../models");

/**
 * Extract subdomain from request host
 * Supports both development (abc.localhost:5000) and production (abc.domain.com)
 */
const extractSubdomain = (req, res, next) => {
  const host = req.get("host");
  
  console.log("🔍 DEBUG: Subdomain middleware - Host header:", host);

  if (!host) {
    req.subdomain = null;
    console.log("🔍 DEBUG: No host header found, setting subdomain to null");
    return next();
  }

  // Development: abc.localhost:5000 or abc.localhost
  const devMatch = host.match(/^([^.]+)\.localhost(?::\d+)?$/);
  if (devMatch && devMatch[1] !== "www") {
    req.subdomain = devMatch[1];
    console.log("🔍 DEBUG: Development subdomain detected:", req.subdomain);
    return next();
  }

  // Production: abc.yourdomain.com (update yourdomain.com with your actual domain)
  const prodMatch = host.match(/^([^.]+)\.yourdomain\.com$/);
  if (prodMatch && prodMatch[1] !== "www") {
    req.subdomain = prodMatch[1];
    console.log("🔍 DEBUG: Production subdomain detected:", req.subdomain);
    return next();
  }

  // No subdomain detected
  req.subdomain = null;
  console.log("🔍 DEBUG: No subdomain detected, setting to null");
  next();
};

/**
 * Resolve hostel from subdomain and attach to request
 * Only for public routes that need hostel context
 */
const resolveHostelFromSubdomain = async (req, res, next) => {
  console.log("🔍 DEBUG: Resolving hostel from subdomain:", req.subdomain);
  
  if (!req.subdomain) {
    console.log("🔍 DEBUG: No subdomain, skipping hostel resolution");
    return next();
  }

  try {
    const hostel = await Hostel.findOne({
      where: {
        subdomain: req.subdomain,
        isActive: true,
      },
      attributes: ["id", "name", "subdomain", "plan", "isActive"],
    });

    if (!hostel) {
      console.log("🔍 DEBUG: Hostel not found for subdomain:", req.subdomain);
      return res.status(404).json({
        message: "Hostel not found",
        subdomain: req.subdomain,
      });
    }

    console.log("🔍 DEBUG: Hostel found:", { id: hostel.id, name: hostel.name, subdomain: hostel.subdomain });
    req.hostel = hostel;
    req.hostelId = hostel.id;
    next();
  } catch (error) {
    console.error("Error resolving hostel from subdomain:", error);
    res.status(500).json({ message: "Server error while resolving hostel" });
  }
};

module.exports = {
  extractSubdomain,
  resolveHostelFromSubdomain,
};
