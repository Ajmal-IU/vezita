const express = require("express");

const router = express.Router();

const {requiresAuth,restrictTo}=require("../middleware/firebaseAuth")

const bannerController = require("../controllers/bannerController");

//upload banner by docter
router
  .route("/docter/upload")
  .post(
    requiresAuth,
    restrictTo('docter'),
    bannerController.uploadBanner
  );

router
  .route("/docter/me")
  .get(
    bannerController.getDocterBanner
  );

router
  .route("/admin/approve/:id")
  .patch(
    requiresAuth,
    restrictTo('admin'),
    bannerController.ApproveBannerAdmin
  );

router
  .route("/admin/reject/:id")
  .patch(
    requiresAuth,
    restrictTo('admin'),
    bannerController.RejectBannerAdmin
  );

router
  .route("/admin/all")
  .get(
    requiresAuth,
    restrictTo('admin'),
    bannerController.getDocterBannerForAdmin
  );

router
.route("/user/all")
.get(
  requiresAuth,
  restrictTo('user'),
  bannerController.getBannerForUser
);

module.exports = router;
