const ErrorHander = require("../utils/errorhander");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");

const Slot = require("../models/docterSlotModel")
const Booking = require("../models/bookingModel");
const DoctorService = require("../models/docterServiceModel");
const mongoose = require("mongoose");
const APIFeatures = require("../utils/apiFeatures");
const Session = require("../models/sessionModel");
const ServiceAvailability = require("../models/serviceAvailability");
const { sendNotification } = require("../utils/notification");
const Patient = require("../models/patientModel");
const Doctor = require("../models/docterModel");
const { sendOrderEmail } = require("../utils/sendEmail");
const analytics = require("../models/analyticsModel");

function formatDate(date) {
  var d = new Date(date),
    month = "" + (d.getMonth() + 1),
    day = "" + d.getDate(),
    year = d.getFullYear();

  if (month.length < 2) month = "0" + month;
  if (day.length < 2) day = "0" + day;

  return [year, month, day].join("-");
}



//create booking
exports.createBooking = catchAsyncErrors(async (req, res) => {
  const user = req.user

  let {slotId,patientId,bookingType,totalAmount} = req.body;


  // console.log(booking.patient)
  let patientObj = await Patient.findById(booking.patient);
  let service = await DoctorService.findById(booking.service);
  let serviceAvailability = await ServiceAvailability.findById(
    serviceAvailability
  );
  let slot = await Slot.findById(slotId);
  if(!slot){
      return next(new AppError("No slot found with this slotId",404));
  }

  const booking = await Booking.create({
    slotId:slotId,
    bookingType:bookingType,
    totalAmount:totalAmount,
    user:user._id,
    docter:slot.docterId,
    patient:patientId,
  });

  if (bookingType === "in-clinic") {
    booking.displayMessage1 = "Booking place";
    booking.displayMessage2 = "Waiting for doctor approval";
  }
  if (bookingType === "video") {
    booking.displayMessage1 = "Booking online";
    booking.displayMessage2 = "Waiting for doctor approval";
    await booking.save();
  }

  // // console.log(booking.patient)
  // let patientObj = await Patient.findById(booking.patient);
  // let service = await DoctorService.findById(booking.service);
  // let serviceAvailability = await ServiceAvailability.findById(
  //   booking.serviceAvailability
  // );

  // let found = serviceAvailability.fixedPriceAvailability.filter(
  //   (serviceAvailId) =>
  //     JSON.stringify(serviceAvailId._id) ==
  //     JSON.stringify(booking.availabilityId)
  // );
  let doctor = await Doctor.findById(doctorId);
  if (booking.status === "pending") {
    //for customer app
    await sendNotification(
      booking.bookedBy.toString(),
      booking.bookedBy,
      `Your Booking for ${patientObj.name}, has been successfully placed.`,
      `Your Booking for ${patientObj.name}, has been successfully placed.`,
      "booking",
      booking._id
    );

    //for doctor app
    await sendNotification(
      // service.doctor.toString(),
      // service.doctor,
      `Hurray!!!, ${patientObj.name} has booked you for a session.`,
      `Hurray!!!, ${patientObj.name} has booked you for a session.`,
      "booking",
      booking._id
    );
  }

  let acceptUrl = `https://api.vezita.com/api/v1/booking/doctor/accept/${booking._id}`;
  let declineUrl = `https://api.vezita.com/api/v1/booking/doctor/decline/${booking._id}`;

  let sDate = formatDate(serviceAvailability.serviceDate);
  // let timeFrom = new Date(found[0].availableFrom).toLocaleTimeString();
  // let timeTo = new Date(found[0].availableTo).toLocaleTimeString();

  // send email to doctor for accepting and declining
  sendOrderEmail(
    "bookingOrder",
    doctor.email,
    patientObj.name,
    patientObj.image,
    service.name,
    sDate,
    timeFrom,
    timeTo,
    Doctor.fullName,
    booking.totalAmount,
    "Booking Confirmation",
    acceptUrl,
    declineUrl
  );

  res.status(200).json({
    status: true,
    booking,
  });
});

//get booking for customer app
exports.getBooking = catchAsyncErrors(async (req, res) => {
  let bookedBy = req.user._id;
  req.query.bookedBy = bookedBy;

  if (req.query.status) {
    bookedBy = mongoose.Types.ObjectId(bookedBy);
    let serviceDate = new Date();
    console.log(serviceDate);
    let booking = await Booking.aggregate([
      {
        $match: {
          $and: [
            {
              $or: [{ status: { $ne: req.query.status } }],
            },
            { bookedBy: bookedBy },
          ],
        },
      },
      {
        $lookup: {
          from: "DoctorService",
          localField: "service",
          foreignField: "_id",
          as: "service",
        },
      },
      {
        $unwind: "$service",
      },
      {
        $lookup: {
          from: "doctor",
          localField: "service.doctor",
          foreignField: "_id",
          as: "service.doctor",
        },
      },
      {
        $unwind: "$service.doctor",
      },
      {
        $lookup: {
          from: "ServiceAvailability",
          localField: "serviceAvailability",
          foreignField: "_id",
          as: "serviceAvailability",
        },
      },
      {
        $lookup: {
          from: "Patient",
          localField: "patient",
          foreignField: "_id",
          as: "patient",
        },
      },
      {
        $lookup: {
          from: "BookingCancelledReason",
          localField: "booking",
          foreignField: "_id",
          as: "bookingCancelledReason",
        },
      },
      {
        $unwind: {
          path: "$bookingCancelledReason",
          preserveNullAndEmptyArrays: true,
        },
      },

      // {
      //     "$unwind":"$serviceAvailability"
      // },
      {
        $match: {
          "serviceAvailability.serviceDate": { $gte: serviceDate },
        },
      },
      {
        $unwind: "$patient",
      },
      {
        $project: {
          _id: 1,
          status: 1,
          active: 1,
          "service._id": 1,
          "service.name": 1,
          "service.doctor._id": 1,
          "service.doctor.fullName": 1,
          "service.doctor.imageUrl": 1,
          bookingType: 1,
          basePrice: 1,
          additionalDiscount: 1,
          totalAmount: 1,
          "patient._id": 1,
          "patient.name": 1,
          "patient.image": 1,
          "patient.address": 1,
          "patient.zipcode": 1,
          availabilityId: 1,
          bookedBy: 1,
          createdAt: 1,
          updatedAt: 1,
          serviceAvailability: 1,
        },
      },
    ]);
    return res.status(200).json({
      status: true,
      results: booking.length,
      booking: booking,
    });
  }

  // for actual status ( status in Database)
  const bookings = new APIFeatures(
    Booking.find()
      .populate({
        path: "service",
        select: "name",
        populate: { path: "doctor", select: "fullName" },
      })
      .populate({ path: "patient", select: "name address zipcode" })
      .populate({ path: "serviceAvailability" }),
    req.query
  ).filter();

  const doc = await bookings.query;

  // const booking = await Booking.find({bookedBy:bookedBy})
  // .populate({path:"service",select:"name",populate:{path:"doctor",select:"fullName"}})
  // .populate({path:"patient",select:"name image address zipcode"})
  // .populate({path:"serviceAvailability"})
  // ;

  res.status(200).json({
    status: true,
    results: doc.length,
    booking: doc,
  });
});

//get bookings for doctor app
exports.getBookingFordoctor = catchAsyncErrors(async (req, res) => {
  let { doctorId, serviceDate } = req.query;
  doctorId = mongoose.Types.ObjectId(doctorId);
  serviceDate = new Date(serviceDate);

  let bookings = await Booking.aggregate([
    {
      $lookup: {
        from: "DoctorService",
        localField: "service",
        foreignField: "_id",
        as: "service",
      },
    },
    {
      $lookup: {
        from: "ServiceAvailability",
        localField: "serviceAvailability",
        foreignField: "_id",
        as: "serviceAvailability",
      },
    },
    {
      $lookup: {
        from: "User",
        localField: "bookedBy",
        foreignField: "_id",
        as: "bookedBy",
      },
    },
    {
      $unwind: "$bookedBy",
    },
    {
      $lookup: {
        from: "UserEmergencyContact",
        localField: "bookedBy._id",
        foreignField: "user",
        as: "bookedBy.emergencyContact",
      },
    },
    {
      $unwind: {
        path: "$bookedBy.emergencyContact",
        preserveNullAndEmptyArrays: true,
      },
    },

    {
      $lookup: {
        from: "Patient",
        localField: "patient",
        foreignField: "_id",
        as: "patient",
      },
    },
    {
      $lookup: {
        from: "BookingCancelledReason",
        localField: "booking",
        foreignField: "_id",
        as: "bookingCancelledReason",
      },
    },
    {
      $unwind: {
        path: "$bookingCancelledReason",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $unwind: "$service",
    },
    {
      $unwind: "$serviceAvailability",
    },
    {
      $unwind: "$patient",
    },
    {
      $match: {
        "service.doctor": doctorId,
      },
    },
    {
      $match: {
        "serviceAvailability.serviceDate": serviceDate,
      },
    },
    {
      $project: {
        _id: 1,
        "service.serviceId": 0,
        "service.createdAt": 0,
        "service.updatedAt": 0,
        "service.__v": 0,
        "serviceAvailability.createdAt": 0,
        "serviceAvailability.updatedAt": 0,
        "serviceAvailability.__v": 0,
        __v: 0,
      },
    },
  ]);

  res.status(200).json({
    status: true,
    results: bookings.length,
    bookings,
  });
});

//update booking status for (cancelled or confirmed)
exports.updateBookingStatus = catchAsyncErrors(async (req, res) => {
  let bookingId = req.params.bookingId;

  let booking = await Booking.findById(bookingId);
  if (!booking) {
    return res.status(404).json({
      status: false,
      msg: "No booking found with this booking Id.",
    });
  }

  let service = await DoctorService.findById(booking.service);
  if (!service) {
    return res.status(404).json({
      status: false,
      msg: "Service not found for this booking.",
    });
  }

  console.log(service.doctor, req.doctor._id);
  // if(JSON.stringify(service.doctor) !== JSON.stringify(req.doctor._id)){
  //     return res.status(400).json({
  //         status:false,
  //         msg:"You don't have permission to perform this action."
  //     })
  // }
  console.log(booking.availabilityId);
  if (req.body.status === "confirmed") {
    let availability;
    if (service.serviceType === "fixed_price") {
      availability = await ServiceAvailability.findOne({
        "fixedPriceAvailability._id": booking.availabilityId,
      });
    } else if (service.serviceType === "hourly_price") {
      availability = await ServiceAvailability.findOne({
        "hourlyAvailability._id": booking.availabilityId,
      });
    }
    let found = availability.fixedPriceAvailability.filter(
      (avail) => avail._id.toString() == booking.availabilityId
    );
    let sessionDurationTimestamp =
      (found[0].availableTo - found[0].availableFrom) / 1000;
    console.log(sessionDurationTimestamp);

    let checkSession = await Session.findOne({ booking: booking._id });
    if (!checkSession) {
      let createSession = await Session.create({
        booking: booking._id,
        duration: sessionDurationTimestamp,
      });
    }
  }

  let updateBooking = await Booking.findByIdAndUpdate(bookingId, req.body, {
    new: true,
  });

  let patient = await Patient.findById(updateBooking.patient);
  let doctor = await Doctor.findById(service.doctor);

  if (updateBooking.status === "confirmed") {
    updateBooking.displayMessage2 = "Your Booking Has been Approved by doctor";
    await updateBooking.save();
    //for customer app
    await sendNotification(
      booking.bookedBy.toString(),
      booking.bookedBy,
      `Your Booking for ${patient.name}, has been accepted by ${doctor.fullName}.`,
      `Your Booking for ${patient.name}, has been accepted by ${doctor.fullName}.`,
      "booking",
      booking._id
    );
  } else if (updateBooking.status === "cancelled") {
    updateBooking.displayMessage2 = "Your Session has been decline by doctor.";
    await updateBooking.save();
    //for customer app
    await sendNotification(
      booking.bookedBy.toString(),
      booking.bookedBy,
      `Your Booking for ${patient.name}, has been decline by ${doctor.fullName}.`,
      `Your Booking for ${patient.name}, has been decline by ${doctor.fullName}.`,
      "booking",
      booking._id
    );
  } else if (updateBooking.status === "active") {
    updateBooking.displayMessage2 = "doctor has started the session.";
    await updateBooking.save();
    //for customer app
    await sendNotification(
      booking.bookedBy.toString(),
      booking.bookedBy,
      `${doctor.fullName}. has started the session for ${patient.name}.`,
      `${doctor.fullName}. has started the session for ${patient.name}.`,
      "booking",
      booking._id
    );
  } else if (updateBooking.status === "completed") {
    let serviceAvailability = await ServiceAvailability.findById(
      updateBooking.serviceAvailability
    );

    let sDate = formatDate(serviceAvailability.serviceDate);
    let timeFrom = new Date(found[0].availableFrom).toLocaleTimeString();
    let timeTo = new Date(found[0].availableTo).toLocaleTimeString();

    sendOrderEmail(
      "orderCompletedEmail",
      doctor.email,
      patient.name,
      patient.image,
      service.name,
      sDate,
      timeFrom,
      timeTo,
      doctor.fullName,
      booking.totalAmount,
      "Booking Invoice"
    );
  }
  updateBooking.displayMessage2 = "Your Session has been completed.";
  await updateBooking.save();
  //for customer app
  await sendNotification(
    booking.bookedBy.toString(),
    booking.bookedBy,
    `${doctor.fullName} has ended the session for ${patient.name}.`,
    `${doctor.fullName} has ended the session for ${patient.name}.`,
    "booking",
    booking._id
  );

  res.status(200).json({
    status: true,
    msg: "Booking updated.",
    booking: updateBooking,
  });
});

//accept order by doctor
exports.acceptOrderByDoctor = catchAsyncErrors(async (req, res) => {
  let { bookingId } = req.params;

  let findBooking = await Booking.findById(bookingId);
  if (!findBooking) {
    return res.status(400).json({
      status: false,
      msg: "There is no booking with this booking Id.",
    });
  }
  // if(findBooking.bookingType !== "video"){
  //     return res.status(400).json({
  //         status:false,
  //         msg:"it's is already verified."
  //     })
  // }

  findBooking.status = "pending";
  findBooking.displayMessage2 = "Waiting for doctor approval";
  await findBooking.save();

  let patient = await Patient.findById(findBooking.patient);
  let service = await DoctorService.findById(findBooking.service);
  let doctor = await doctor.findById(service.doctor);

  if (findBooking.status == "pending") {
    //for customer app
    await sendNotification(
      findBooking.bookedBy.toString(),
      findBooking.bookedBy,
      `Your Booking for ${patient.name} with ${doctor.fullName}, has been approved.`,
      `Your Booking for ${patient.name} with ${doctor.fullName}, has been approved.`,
      "booking",
      findBooking._id
    );

    //for doctor app
    await sendNotification(
      doctor._id.toString(),
      doctor._id,
      `Hurray!!!, ${patient.name} has booked you for a session.`,
      `Hurray!!!, ${patient.name} has booked you for a session.`,
      "booking",
      findBooking._id
    );
  }
  let analytic = await analytics.Create({
    doctor: doctor,
    accepted: {
      isAccepted: true,
      time: Date(Date.now()).toLocaleTimeString(),
      date: Date.now().toString(),
    },
  });

  res.render("accept", { data: "order" });
  // res.status(200).json({
  //     status:true,
  //     msg:`Booking for client ${patient.name} is accepted by doctor.`
  // })
});

// decline order by doctor
exports.declineOrderByDoctor = catchAsyncErrors(async (req, res) => {
  let { bookingId } = req.params;

  let findBooking = await Booking.findById(bookingId);
  if (!findBooking) {
    return res.status(400).json({
      status: false,
      msg: "There is no booking with this booking Id.",
    });
  }
  // if(findBooking.bookingType !== "video"){
  //     return res.status(400).json({
  //         status:false,
  //         msg:"Booking is already verified."
  //     })
  // }

  findBooking.status = "cancelled";
  findBooking.displayMessage2 = "Your Session has been declined by doctor";
  await findBooking.save();

  let patient = await Patient.findById(findBooking.patient);
  let service = await DoctorService.findById(findBooking.service);
  let doctor = await Doctor.findById(service.doctor);

  if (findBooking.status == "cancelled") {
    //for customer app
    await sendNotification(
      findBooking.bookedBy.toString(),
      findBooking.bookedBy,
      `Your Booking for ${patient.name} with ${doctor.fullName} is cancelled.`,
      `Your Booking for ${patient.name} with ${doctor.fullName} is cancelled.`,
      "booking",
      findBooking._id
    );
  }
  let analytic = await analytics.Create({
    doctor: doctor,
    declined: {
      isDeclined: true,
      time: Date(Date.now()).toLocaleTimeString(),
      date: Date.now().toString(),
    },
  });
  res.render("decline");
  // res.status(200).json({
  //     status:true,
  //     msg:`Booking for client ${patient.name} is declined by Doctor.`
  // })
});

// get all bookungs for admin
exports.getAllBookingsForAdmin = catchAsyncErrors(async (req, res) => {
  // for actual status ( status in Database)
  const bookings = new APIFeatures(
    Booking.find()
      .populate({
        path: "service",
        select: "name",
        populate: { path: "doctor", select: "fullName" },
      })
      .populate({ path: "patient", select: "name image address zipcode" })
      .populate({ path: "serviceAvailability" }),
    req.query
  ).filter();
  const doc = await bookings.query;
  res.status(200).json({
    status: true,
    results: doc.length,
    booking: doc,
  });
});
