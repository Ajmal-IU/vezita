const express = require("express");

const {
  addPatient,
  addPatientMedical,
  updatePatient,
  getSinglePatient,
  getUserPatients,
} = require("../controllers/patientController");

const {requiresAuth,restrictTo}=require("../middleware/firebaseAuth")

const router = express.Router();

router
  .route("/add")
  .post(requiresAuth,restrictTo('user'), addPatient);

router
  .route("/edit/:patientId")
  .patch(requiresAuth,restrictTo('user'), updatePatient);

router
  .route("/get/:patientId")
  .get(getSinglePatient);

router
  .route("/add-patientMedical")
  .put(requiresAuth,restrictTo('user'), addPatientMedical);

router
  .route("/me")
  .get(requiresAuth,restrictTo('user'),getUserPatients);

module.exports = router;
