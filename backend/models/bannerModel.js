const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema({
  bannerImage: {
    url: {
      type: String,
      required: true,
    },
    public_url: {
      type: String,
      required: true,
    },
  },
  
  discountPercentage: {
    type: Number,
    required: true,
  },

  docter: {
    type: mongoose.Types.ObjectId,
    ref: "User",
    required: true,
  },
  status: {
    type: String,
    enum: ["Rejected", "Pending", "Approved"],
    default: "Pending",
  },
  bannerExpire: {
    type: Date,
  },
  reasonForRejection: {
    type: String,
    select: false,
  },
});

module.exports = mongoose.model("Banner", bannerSchema);
