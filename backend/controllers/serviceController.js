const ErrorHander = require("../utils/errorhander");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const mongoose = require("mongoose");

const Specialization = require("../models/specializationModel");
const DocterSpecialization = require("../models/docterSpecializationModel");
const Service = require("../models/serviceModel");
const DocterService = require("../models/docterServiceModel");

exports.addSpecialization = catchAsyncErrors(async (req, res, next) => {
  const { name: specialization } = req.body;

  const sp = await Specialization.findOne({ name: specialization });

  if (sp)
    return next(new ErrorHander(`${specialization} is already registered`));

  const newSpecialization = await Specialization.create({ name: specialization });
  res.status(201).json({ msg: "success", specialization:newSpecialization});
});

exports.updateSpecialization = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const specialization = await Specialization.findById(id);
  if (!specialization) return next(new ErrorHander("Not Found", 404));
  specialization.name = req.body.name;
  specialization.save();
  res.status(200).json({ msg: "Updated Successfully" });
});

exports.deleteSpecialization = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  await Specialization.findByIdAndDelete(id);
  res.status(200).json({ msg: "success" });
});

exports.getAllSpecialization = catchAsyncErrors(async (req, res, next) => {
  const specialization = await Specialization.aggregate([
    {
      $project: {
        specialization: "$name",
        icon: "$icon.url",
        _id: 0,
        id: "$_id",
      },
    },
  ]);

  res.status(200).json(specialization);
});

//Add Docter Specialization (Docter)
exports.addDocterSpecialization = catchAsyncErrors(async (req, res, next) => {
  const { specializationIds } = req.body;
  specializationIds.forEach(async (id) => {
    await DocterSpecialization.create({
      specializationId: id,
      docter: req.docter._id,
    });
  });
  res.status(201).json({ msg: "success" });
});

//My Specialization (Docter)
exports.mySpecialization = catchAsyncErrors(async (req, res, next) => {
  const sp = await DocterSpecialization.aggregate([
    {
      $match: { docter: req.params.id },
    },
    {
      $project: {
        specialization: "$name",
        icon: "$icon.url",
        _id: 0,
        id: "$_id",
      },
    },
  ]);

  res.status(200).json(sp);
});

//Delete Docter Specialization (Docter)
exports.deleteDocterSpecialization = catchAsyncErrors(
  async (req, res, next) => {
    await DocterSpecialization.deleteOne({ _id: req.params.id });

    res.status(200).json({ msg: "Specialization Deleted Successfully" });
  }
);

//Add Services (Admin)
exports.addServices = catchAsyncErrors(async (req, res, next) => {
  const { name: service, specializationId } = req.body;

  const specialization = await Specialization.findOne({
    _id: mongoose.Types.ObjectId(specializationId),
  });

  if (!specialization) return next(new ErrorHander(`specialization is not available`));
  const sp = await Service.findOne({
    name: service,
  });

  if (sp) return next(new ErrorHander(`${service} is already registered`));

  const newService = await Service.create({
    name: service,
    specialization: mongoose.Types.ObjectId(specializationId),
  });
  res.status(201).json({ msg: "success",service:newService });
});

//Get Service (Docter)
exports.getAllServices = catchAsyncErrors(async (req, res, next) => {
  const service = await Service.aggregate([
    {
      $project: {
        service: "$name",
        icon: "$icon.url",
        _id: 0,
        id: "$_id",
      },
    },
  ]);

  res.status(200).json(service);
});

//Get Services By Specialization (Docter,user,admin)
exports.getServicesBySpecialization = catchAsyncErrors(
  async (req, res, next) => {
    const service = await Service.aggregate([
      {
        $match: { specialization: mongoose.Types.ObjectId(req.params.id) },
      },
      {
        $project: {
          service: "$name",
          icon: "$icon.url",
          _id: 0,
          id: "$_id",
        },
      },
    ]);
    res.status(200).json({ service });
  }
);

//Delete Service (Admin)
exports.deleteService = catchAsyncErrors(async (req, res, next) => {
  await Service.deleteOne({ _id: req.params.id });

  res.status(200).json({ msg: "Service Deleted Successfully" });
});

//Add Docter Services (Docter)
exports.addDocterServices = catchAsyncErrors(async (req, res, next) => {
  const { serviceIds } = req.body;
  serviceIds.forEach(async (id) => {
    await DocterService.create({
      serviceId: id,
      docter: req.docter._id,
    });
  });
  res.status(201).json({ msg: "success" });
});

//Delete Docter Service (Docter)
exports.deleteDocterService = catchAsyncErrors(async (req, res, next) => {
  await DocterService.deleteOne({ _id: req.params.id });

  res.status(200).json({ msg: "Service Deleted Successfully" });
});

// Get All Service By Docter

exports.getAllServiceByDocter = catchAsyncErrors(async (req, res, next) => {
  const userId = req.user._id;

  const results = await DocterService.find({ docter: userId });

  res.status(200).json({ success: true, results });
});
