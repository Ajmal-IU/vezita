const fs = require("fs");

const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const { google } = require("googleapis");
const requirementValidator = require("../utils/requirementValidator");
const appointmentUtility = require("../utils/appointmentUtility");

const TIMESLOTS_PATH = "./Utility/timeslots.json";

const Session = require("../models/sessionModel");

function getResult(appointments) {
  const timeslots = JSON.parse(fs.readFileSync(TIMESLOTS_PATH)).timeslots;
  let resultsArr = [];
  for (let i = 0; i < timeslots.length; i++) {
    const found = appointments.find(function (element) {
      const startTime = element.startTime;
      const finalStartTime = startTime.substring(
        startTime.indexOf("T"),
        startTime.indexOf("Z") + 1
      );
      return timeslots[i].startTime.includes(finalStartTime);
    });
    if (!found) {
      resultsArr.push(timeslots[i]);
    }
  }
  return resultsArr;
}

exports.getAvailTimeslots = catchAsyncErrors(async (req, res, next) => {
  const isInvalid = requirementValidator.validateGetTimeslots(
    req.year,
    req.month,
    req.day
  );
  if (isInvalid) return reject(isInvalid);

  const startDate = new Date(Date.UTC(year, month - 1, day));
  const endDate = appointmentUtility.getNextDay(startDate);
  const calendar = google.calendar({ version: "v3", auth });
  calendar.events.list(
    {
      calendarId: "primary",
      timeMin: startDate.toISOString(),
      timeMax: endDate.toISOString(),
      maxResults: 11,
      singleEvents: true,
      orderBy: "startTime",
      q: "appointment",
    },
    (err, res) => {
      if (err) return reject({ response: "The API returned an error: " + err });
      let appointments = res.data.items.map((event, i) => {
        return {
          startTime: event.start.dateTime,
          endTime: event.end.dateTime,
        };
      });
      const result = {};
      result.timeslots = getResult(appointments);
      if (result.timeslots[0]) {
        const response = Object.assign({ success: true }, result);
        return resolve(response);
      } else {
        const response = Object.assign({ success: false }, result);
        return reject(response);
      }
    }
  );
});

function getAvailTimeslots(auth, year, month, day) {
  return new Promise(function (resolve, reject) {
    const isInvalid = requirementValidator.validateGetTimeslots(
      year,
      month,
      day
    );
    if (isInvalid) return reject(isInvalid);

    const startDate = new Date(Date.UTC(year, month - 1, day));
    const endDate = appointmentUtility.getNextDay(startDate);
    const calendar = google.calendar({ version: "v3", auth });
    calendar.events.list(
      {
        calendarId: "primary",
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        maxResults: 11,
        singleEvents: true,
        orderBy: "startTime",
        q: "appointment",
      },
      (err, res) => {
        if (err)
          return reject({ response: "The API returned an error: " + err });
        let appointments = res.data.items.map((event, i) => {
          return {
            startTime: event.start.dateTime,
            endTime: event.end.dateTime,
          };
        });
        const result = {};
        result.timeslots = getResult(appointments);
        if (result.timeslots[0]) {
          const response = Object.assign({ success: true }, result);
          return resolve(response);
        } else {
          const response = Object.assign({ success: false }, result);
          return reject(response);
        }
      }
    );
  });
}

exports.addServiceAvailability = catchAsyncErrors(async (req, res, next) => {
  const data = {
    doctorId: req.docter._id,
    sessionType: req.body.sessionType,
    workingDays: req.body.workingDays,
    slot: req.body.slots,
  };

  const availability = await Session.create(data);

  res.status(201).json({ message: "avaliability created", availability });
});

exports.availabilityForUser = catchAsyncErrors(async (req, res, next) => {
  const { year, month, day, slotId } = req.body;
  const currDate = appointmentUtility.getCurrDateUTC();

  const slotDate = new Date(Date.UTC(year, month, day));

  if (slotDate < currDate)
    return next(new ErrorHander("slot not available", 401));

  const availability = Session.aggregate([
    {
      $match: {
        $and: [{ docterId: req.params.docterId }, {}],
      },
    },
    { $unwind: "$slots" },
  ]);

  res.status(200).json(availability);
});

exports.checkAvailability = catchAsyncErrors(async (req, res, next) => {
  const { year, month, day, slotId } = req.body;

  const startDate = new Date(Date.UTC(year, month, day));
  const isInvalid = requirementValidator.validateGetTimeslots(
    req.year,
    req.month,
    req.day
  );

  if (isInvalid) next(new ErrorHander("Slot are not available", 400));
  const found = await Booking.findOne({
    $and: [{ slot: slotId, bookingDate: startDate }],
  });

  if (found) next(new ErrorHander("Slot unavailable", 400));

  res.status(200).json({ message: "Slot available" });
});

