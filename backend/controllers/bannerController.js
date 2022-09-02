const ErrorHandler = require("../utils/errorhander");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");

const Banner = require("../models/bannerModel");

exports.uploadBanner = catchAsyncErrors(async (req, res, next) => {
  const data = {
    docter: req.user._id,
    bannerImage:req.body.bannerImage,
    discountPercentage: req.body.discountPercentage,
    bannerExpire: req.body.date,
  };

  const newBanner = await Banner.create(data);

  res.status(201).json({
    msg: "submitted ! it will be reflect after admin approve",
    newBanner,
  });
});

exports.ApproveBannerAdmin = catchAsyncErrors(async (req, res, next) => {
  const banner = await Banner.findById(req.params.id);

  if (!banner)
    return next(new ErrorHandler("Banner Id Invalid Not Found", 404));

  banner.status = "Approved";

  banner.save();

  res.status(200).json({ success: true });
});

exports.RejectBannerAdmin = catchAsyncErrors(async (req, res, next) => {
  if (req.body.reason)
    return next(new ErrorHandler("Enter the reason for rejection", 400));

  const banner = await Banner.findById(req.params.id);

  if (!banner)
    return next(new ErrorHandler("Banner Id Invalid Not Found", 404));

  banner.status = "Rejected";

  banner.reasonForRejection = req.body.reason;

  res.status(200).json({ success: true });
});

exports.getDocterBanner = catchAsyncErrors(async (req, res, next) => {
  const uploadedBanners = await Docter.find({ docter: req.user._id }).select(
    "+reasonForRejection"
  );

  res.status(200).json({
    uploadedBanners,
    success: true,
  });
});

exports.getDocterBannerForAdmin = catchAsyncErrors(async (req, res, next) => {
  const uploadedBanners = await Banner.find({}).select("+reasonForRejection");

  res.status(200).json({
    uploadedBanners,
    success: true,
  });
});

exports.getBannerForUser = catchAsyncErrors(async (req, res, next) => {
  const uploadedBanners = await Banner.find({status:"Approved"})

  res.status(200).json({
    uploadedBanners,
    success: true,
  });
});

// let users;
// let search = req.query.search; 
// if(search){
//   let QStringName = searchQuery(search,"name");
//   let QStringEmail = searchQuery(search,"email");
//   users = await User.find({$or:QStringName.concat(QStringEmail)});
//   return res.status(200).json({
//       status:true,
//       results:users.length,
//       message:"all users",
//       users
//   })
// }
// users = new APIFeatures(User.find(),req.query).filter();
// const doc = await users.query;

// res.status(200).json({
//     status:true,
//     results:doc.length,
//     message:"all users",
//     users:doc
// })
