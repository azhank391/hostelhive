const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const { sequelize } = require("./models");
const morgan = require("morgan");

//load env
dotenv.config();

//intialize express app
const app = express();

//middleware
// 🚀 IMPROVED: CORS configuration to support subdomains
const corsOptions = {
  origin: function (origin, callback) {
    console.log('🔍 DEBUG: CORS origin check:', origin);
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log('✅ CORS: Allowing request with no origin');
      return callback(null, true);
    }
    
    // Development: Allow localhost and subdomain.localhost
    if (origin.includes('localhost')) {
      console.log('✅ CORS: Allowing localhost origin:', origin);
      return callback(null, true);
    }
    
    // Production: Allow main domain and subdomains
    // Update 'yourdomain.com' with your actual domain
    const allowedDomains = [
      'http://localhost:3000',
      'https://yourdomain.com',
      /^https?:\/\/[a-zA-Z0-9-]+\.yourdomain\.com$/
    ];
    
    const isAllowed = allowedDomains.some(domain => {
      if (typeof domain === 'string') {
        return origin === domain;
      } else if (domain instanceof RegExp) {
        return domain.test(origin);
      }
      return false;
    });
    
    if (isAllowed) {
      console.log('✅ CORS: Allowing production origin:', origin);
      callback(null, true);
    } else {
      console.log('🚫 CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Host']
};

app.use(cors(corsOptions)); //enable CORS

// Ensure JSON parsing is working correctly
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
  }
})); //parse JSON bodies

app.use(express.urlencoded({ extended: true })); //parse URL-encoded bodies
app.use(morgan("dev")); //HTTP request logger

//health check route
app.get("/health", (req, res) => {
  res.json({ message: "HostelHive API is running yayyy" });
});

// Import subdomain middleware
const { extractSubdomain, resolveHostelFromSubdomain } = require("./middleware/subdomainMiddleware");

// Apply subdomain middleware globally
app.use(extractSubdomain);

// Mount routes
const authRoutes = require("./routes/auth");
const hostelRoutes = require("./routes/hostels");
const hostelResolverRoutes = require("./routes/hostel-resolver");
const adminRoutes = require("./routes/admin");
const studentRoutes = require("./routes/student");
const superadminRoutes = require("./routes/superadmin");

// Apply hostel resolution middleware to auth routes for subdomain login
app.use("/api/auth", resolveHostelFromSubdomain, authRoutes);
app.use("/api/hostels", hostelRoutes);
app.use("/api/hostel-resolver", hostelResolverRoutes); // Add the missing route
app.use("/api/hostels/:hostelId/admin", adminRoutes); // 🔧 URL-based admin routes (for owners)
app.use("/api/admin", adminRoutes); // 🔧 NEW: Direct admin routes for warden dashboard
app.use("/api/student", studentRoutes);
app.use("/api/superadmin", superadminRoutes);

//connect db and start server
const Port = process.env.PORT || 5000;
sequelize
  .authenticate()
  .then(() => {
    console.log("Database connected successfully");
    app.listen(Port, () => {
      console.log(`Server is running on port ${Port}`);
    });
  })
  .catch((err) => {
    console.error("Unable to connect to the database:", err);
  });
