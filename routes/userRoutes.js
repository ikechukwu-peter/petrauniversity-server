const express = require("express");
const profileController = require("./../controllers/profileController");
const authController = require("./../controllers/authController");

const router = express.Router();

//authentication
router.post("/signup", authController.signup);
router.put(
  "/auth/user/verification/verify-account/:userId/:secretCode",
  authController.verifyEmail
);
router.post("/login", authController.login);
router.put("/user/forgotPassword", authController.forgotPassword);
router.put("/user/resetPassword/:token", authController.resetPassword);
router.put(
  "/user/updatePassword",
  authController.authenticate,
  authController.updatePassword
);
router.get(
  "/resendverification/:email/:userId",
  authController.resendVerificationEmail
);

router.get(
  "/user/getAllUsers",
  authController.authenticate,
  profileController.getAllUsers
);
router.get(
  "/user/getUser/:id",
  authController.authenticate,
  profileController.getUser
);

// router.put(
//   "/user/updateUser",
//   authController.authenticate,
//   profileController.updateUser
// );
// router.delete(
//   "/user/deleteUser",
//   authController.authenticate,
//   profileController.deleteUser
// );

router.post(
  "/user/createprofile",
  authController.authenticate,
  profileController.createProfile
);
module.exports = router;
