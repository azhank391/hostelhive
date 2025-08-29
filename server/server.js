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
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
})); //enable CORS

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

// Mount routes
const authRoutes = require("./routes/auth");
const hostelRoutes = require("./routes/hostels");
const hostelResolverRoutes = require("./routes/hostel-resolver");
const adminRoutes = require("./routes/admin");
const studentRoutes = require("./routes/student");
const superadminRoutes = require("./routes/superadmin");

app.use("/api/auth", authRoutes);
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
