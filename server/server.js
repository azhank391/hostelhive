const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const { sequelize } = require("./models");
const morgan = require("morgan");

//load env
dotenv.config();

//intialize express app
const app = express();

// Mount Stripe webhook BEFORE json parser; the route itself uses express.raw
const webhookRoutes = require("./routes/webhook");
app.use('/api/webhooks', webhookRoutes);

//middleware
app.use(cors()); //enable CORS
app.use(express.json()); //parse JSON bodies for regular routes
app.use(morgan("dev")); //HTTP request logger

//health check route
app.get("/health", (req, res) => {
  res.json({ message: "HostelHive API is running" });
});

// Mount routes
const billingRoutes = require("./routes/billing");
const authRoutes = require("./routes/auth");
const hostelRoutes = require("./routes/hostels");
const hostelResolverRoutes = require("./routes/hostel-resolver");
const adminRoutes = require("./routes/admin");
const studentRoutes = require("./routes/student");
const superadminRoutes = require("./routes/superadmin");
const rbacRoutes = require("./routes/rbac");

app.use("/api/auth", authRoutes);
app.use("/api/hostels", hostelRoutes);
app.use("/api/hostel-resolver", hostelResolverRoutes); // Add the missing route
app.use("/api/hostels/:hostelId/admin", adminRoutes); // 🔧 URL-based admin routes
app.use("/api/student", studentRoutes);
app.use("/api/superadmin", superadminRoutes);
app.use("/api/rbac", rbacRoutes); // 🔐 RBAC routes
app.use("/api/billing", billingRoutes);

//connect db and start servera
const Port = process.env.PORT;
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
