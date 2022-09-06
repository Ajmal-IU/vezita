const express = require("express");

const router = express.Router();

const {requiresAuth,restrictTo}=require("../middleware/firebaseAuth")

const appointment = require("../controllers/appointmentController");

router
  .route("/add-service-availability")
  .post(
    requiresAuth,
    restrictTo('doctor'),
    appointment.addServiceAvailability
  );

router
  .route("/get-result")
  .get(
    appointment.getResult
  );

  router
  .route("/get-availtimeslot")
  .get(
    appointment.getAvailTimeslots
  );

  router
  .route("/get-availabilityforuser")
  .get(
    appointment.availabilityForUser
  );

  router
  .route("/check-availability")
  .get(
    appointment.checkAvailability
  );

module.exports = router;