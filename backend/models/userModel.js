const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    trim:true,
    default:"Unknown"
  },
  uid: {
    type: String,
    required: true,
    unique:true
  },
  firebaseSignInProvider: {
    type: String,
  },
  email: {
    type: String,
    default:"testuser@gmail.com"
  },
  avatar: {
    type: String,
    default:"https://i.pinimg.com/originals/6e/70/97/6e7097e29b6bc038069e5b375069c1c7.jpg"
  },
  role: {
    type: String,
    enum: ["user", "docter", "admin"],
    default: "user",
  },
  active: {  // for user block functionality. if (active=false) then user is blocked.
    type: Boolean,
    default:true
  },
  isDeleted:{  // to soft delete user. if(isDeleted = true), then user is deleted.
    type:Boolean,
    default:false
  }
},
  {timestamps:true}
);

userSchema.pre(/^find/,function(next){
  this.find({isDeleted:{$ne:true}})
  next();
});

module.exports = mongoose.model("User", userSchema);
