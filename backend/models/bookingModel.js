const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    slotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DocterSlot",
    },
    serviceAvailability: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceAvailability",
      required: true,
    },
    bookingType: {
      type: String,
      enum: ["in-clinic", "video"],
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Docter",
    },
    doctorLocation: {
      type: String,
    },
    basePrice: {
      type: Number,
    },
    additionalDiscount: {
      type: Number,
    },
    totalAmount: {
      type: Number,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
    },
    availabilityId: {
      type: String,
      required: true,
    },
    bookedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "active", "completed", "cancelled"],
      default: "pending",
    },
    displayMessage1: {
      type: String,
    },
    displayMessage2: {
      type: String,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);
