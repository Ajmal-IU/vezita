// const { auth } = require("firebase-admin");
const admin = require("firebase-admin");
const ErrorHandler = require("../utils/errorhander");
const User = require("../models/userModel");
const { getAuth, signInWithCustomToken } = require("firebase/auth");
require("../utils/firebaseConfig");
require("dotenv").config();


const requiresAuth = async(req, res, next) =>{
  const idToken = req.header("token");
  console.log(idToken)
  if(!idToken){
      return next(new ErrorHandler('Please pass firebase auth token ',400));
  }
  let decodedIdToken;
  try{
      decodedIdToken = await admin.auth().verifyIdToken(idToken,true)
  }catch(error){
      next(error);
      return
  }
  let user = await User.findOne({uid:decodedIdToken.uid});
  if(!user){
    if(req.baseUrl + req.path==="/api/v1/user/onboarding"){
            user = await User.create({
                name:decodedIdToken.name,
                email:decodedIdToken.email,
                avatar:decodedIdToken.picture,
                uid:decodedIdToken.uid,
                firebaseSignInProvider:decodedIdToken.firebase.sign_in_provider,
                role:req.body.role,
            })
      }else{
        return next(new ErrorHandler("User not found",404));
    }
  }
  req.user = user;
  next();
};


const restrictTo = (...roles) =>{
  return (req,res,next) =>{
      if(!roles.includes(req.user.role)){
          return next(new ErrorHandler('You do not have permission to perform this action',403));
      }
      next();
  }
};

const generateToken = async(req,res,next) => {

  try{
      const token =  await admin.auth().createCustomToken(req.params.uid);
      const user = await signInWithCustomToken(getAuth(),token);
      const idToken = user._tokenResponse.idToken

      return res.status(200).json({
          status: true,
          token: idToken
      });

  }catch(err){
      console.log(err)
      return res.status(500).json({
          status:false,
          msg:err.message
      })
  }
}

module.exports = {
  requiresAuth,
  restrictTo,
  generateToken
}