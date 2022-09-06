const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require("cors");

const errorMiddleware = require("./middleware/error");

// const { refreshToken } = require("./middleware/auth");

// Config
if (process.env.NODE_ENV !== "PRODUCTION") {
  require("dotenv").config({ path: "backend/config/config.env" });
}
app.use(cors('*'));

app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get("/",(req,res) =>{
  res.status(200).json({
      status:true,
      msg:"working...",
      user:req.user
  })
})

// Route Imports
const user = require("./routes/userRoute");
const docter = require("./routes/docterRoute");
const review = require("./routes/reviewRoute");
const appointmentRoute = require("./routes/appointmentRoute");
const service = require("./routes/serviceRoute");
const coupon = require("./routes/couponRoute");
const payment = require("./routes/paymentRoute");
const patient = require("./routes/patientRoute");
const report = require("./routes/reportRoute");
const booking = require("./routes/bookingRoute");
const serviceAvailability = require("./routes/serviceAvailabilityRoute");
const package = require("./routes/packageRoute");
const admin = require("./routes/adminRoute");
const wishlist = require("./routes/wishlistRoute");
const banner = require("./routes/bannerRoute");
const prescription = require("./routes/prescriptionRoute");
const analytics = require("./routes/analyticsRoute");

//route middleware
app.use("/api/v1/user", user);
app.use("/api/v1/docter", docter);
app.use("/api/v1/review", review);
app.use("/api/v1/appointment", appointmentRoute);
app.use("/api/v1/service", service);
app.use("/api/v1/coupon", coupon);
app.use("/api/v1/payment", payment);
app.use("/api/v1/patient", patient);
app.use("/api/v1/report", report);
app.use("/api/v1/booking", booking);
app.use("/api/v1/seviceAvailability", serviceAvailability);
app.use("/api/v1/package", package);
app.use("/api/v1/admin", admin);
app.use("/api/v1/wishlist", wishlist);
app.use("/api/v1/banner", banner);
app.use("/api/v1/prescription", prescription);
app.use("/api/v1/analytics", analytics);

//refreshToken

// app.post("/api/v1/refreshToken", refreshToken);

//random route
app.use("/*", (req, res, next) => {
  res.status(404).json({
    method: req.method,
    statusCode: 404,
    error: `${req.baseUrl} route not found`,
  });
});

// Middleware for Errors
app.use(errorMiddleware);

module.exports = app;
