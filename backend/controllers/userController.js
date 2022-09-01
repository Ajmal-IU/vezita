const ErrorHander = require("../utils/errorhander");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const { sendEmail } = require("../utils/sendEmail");
const APIFeatures = require("../utils/apiFeatures");
const crypto = require("crypto");
// const referralCodeGenerator = require("referral-code-generator");

//models
// const UserWallet = require("../models/userWallet");
const User = require("../models/userModel");
const UserTemporary = require("../models/userTemporary");
const { validationResult } = require('express-validator');

//register
exports.createTemporaryUser =catchAsyncErrors(async(req,res,next) =>{

      const {name,email,uid} = req.body;
      console.log(req.body);
      console.log(req.query);
      let isNewUser = false;
      let user = await User.findOne({email:email,uid:uid});
  
      if(user){
          return res.status(200).json({
              status:false,
              msg:'user already exist'
          });
      }  
      const checkUser = await UserTemporary.findOne({email:email});

      if(checkUser){
          const tempUser = await UserTemporary.findByIdAndUpdate(checkUser._id,{
              uid:uid,
              name:name
          });
      }else{
          const tempUser = await UserTemporary.create({
              email:email,
              uid:uid,
              name:name
          });
      }
      
      return res.status(200).json({
          status:true,
          msg: "temp user add successfully",
      });
});

//on-boarding
exports.onBoarding = catchAsyncErrors(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
      // const error = new Error('Validation failed.');
      return res.status(422).json({
          status:false,
          errors:errors.array()
      })
  }
  const {email,photoUrl} = req.body;
 
  const user = req.user;


    let tempUser = await UserTemporary.findOne({email:email});
    if(tempUser){
      let displayName=tempUser.name

    
      userUpdate = await User.findByIdAndUpdate(user._id,{
          email:email,
          name:displayName,
          avatar:photoUrl,
      });

      await UserTemporary.findByIdAndDelete(tempUser._id);
    }else{
      userUpdate = await User.findByIdAndUpdate(user._id,{new:true});
    }
    if(!userUpdate){
      return res.status(422).json({
        status:false,
        errors:errors.array()
    })
    }
  
  res.status(200).json({
    status:true,
    message:"User onboarded.",
    user:userUpdate,
  })
});

// Login User
exports.loginUser = catchAsyncErrors(async (req, res, next) => {
  const user = req.user;

  res.status(200).json({
    status:true,
    message:"User details",
    user:user
  })
});

// Get all users(admin)
exports.getAllUser = catchAsyncErrors(async (req, res, next) => {
  let users;
  let search = req.query.search; 
  if(search){
    let QStringName = searchQuery(search,"name");
    let QStringEmail = searchQuery(search,"email");
    users = await User.find({$or:QStringName.concat(QStringEmail)});
    return res.status(200).json({
        status:true,
        results:users.length,
        message:"all users",
        users
    })
  }
  users = new APIFeatures(User.find(),req.query).filter();
  const doc = await users.query;

  res.status(200).json({
      status:true,
      results:doc.length,
      message:"all users",
      users:doc
  })
});

// Get User Detail
exports.getUserDetails = catchAsyncErrors(async (req, res, next) => {
  const userId = req.params.userId;

  let user = await User.findById(userId);
  return res.status(200).json({
      status:true,
      message:"get user details",
      user:user
  })
});

//update user
exports.updateUser = catchAsyncErrors(async(req,res,next) =>{
  const user = req.user;
  const userId = req.params.userId;

  if(user.userType==="admin" || JSON.stringify(user._id)===JSON.stringify(userId)){
      let updatedUser = await User.findByIdAndUpdate(userId,req.body,{new:true});
      return res.status(200).json({
          status:true,
          message:"User updated",
          user:updatedUser
      })
  }else{
      return next(new ErrorHander("You don't have permission to edit user",400))
  }
})


