const crypto = require("crypto");
const { promisify } = require("util");
const jwt = require("jsonwebtoken");

const User = require("../models/userModel");
const sendEmail = require("./../utils/email");
//const AppError = require("./../utils/appError");
//const catchAsync = require("./../utils/catchAsync");

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRESIN,
  });
};
const encryption = (value) => {
  return crypto.createHash("sha256").update(value).digest("hex");
};

//To register a user
exports.signup = async (req, res) => {
  try {
    const { email, password, passwordConfirm } = req.body;

    if (!email || !password || !passwordConfirm) {
      return res.status(400).json({
        status: "fail",
        message: "Please provide email, password and passwordConfirm!",
      });
    }
    if (password.length < 8) {
      return res.status(400).json({
        status: "fail",
        message: "The mininum allowed password is eight combinations ",
      });
    }

    if (!(password === passwordConfirm)) {
      return res.status(400).json({
        status: "fail",
        message: "Password is not the same",
      });
    }
    //This creates a random code to be sent along for verification
    const randomToken = crypto.randomBytes(32).toString("hex");
    const verificationToken = encryption(randomToken);

    //Creation of user
    const newUser = await User.create({
      email,
      password,
      passwordConfirm,
      verificationToken,
    });

    //The URL sent to the email of the user
    const verifyEmailAddress = `${req.protocol}://${req.get(
      "host"
    )}/api/auth/user/verification/verify-account/${newUser._id}/${randomToken}`;

    //the message sent along with the url for verification
    const message = `You have just signed up for Petra University, \nclick this link: ${verifyEmailAddress} to confirm your email and continue with your set up. \nIf you didn't sign up for Petra University please ignore this email.`;
    const html = `<p>You have just signed up for Petra University, \nclick this link: <a href=${verifyEmailAddress}>${verifyEmailAddress} </a>to confirm your email and continue with your set up. \n <br /> If you didn't sign up for Petra University please ignore this email.</p>`;

    //email sent here
    await sendEmail({
      email,
      subject: " Petra Univeristy, confirm  Email  (valid for an hour)",
      html,
      message,
    });

    res.status(201).json({
      status: "success",
      email,
      user_id: newUser._id,
    });
  } catch (err) {
    if ((err.name = "ValidatorError")) {
      return res.status(400).json({
        status: "fail",
        message: "Email taken already ",
      });
    }
    res.status(500).json({
      status: "fail",
      message: "There was an error sending the email, try again!",
    });
  }
};

//Logs user in

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    // 1) Check if email and password exist
    if (!email || !password) {
      return res.status(400).json({
        status: "fail",
        error: "Please provide email and password!",
      });
    }
    // 2) Check if user exists && password is correct
    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await user.correctPassword(password, user.password))) {
      return res.status(401).json({
        status: "fail",
        message: "Incorrect email or password ",
      });
    }
    if (user.status === "pending") {
      return res.status(401).json({
        status: "fail",
        email,
        user_id: user._id,
      });
    }
    //Create token
    const token = signToken(user._id);
    return res.status(200).json({
      status: "success",
      token,
    });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: "Something went wrong, please try again",
    });
  }
};

exports.authenticate = async (req, res, next) => {
  try {
    let token;
    //Get the token
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        status: "fail",
        message: "You are not logged in. Please log in to get access",
      });
    }

    //Verification of token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    //check if user still exist

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        status: "fail",
        message: "The user belonging to this token does no longer exist",
      });
    }
    if (user.changedPasswordAfter(decoded.iat)) {
      return res.status(401).json({
        status: "fail",
        message: "User recently changed password. Please log in again",
      });
    }

    // add user from payload
    req.user = user;

    next();
  } catch (err) {
    if ((err.name = "JsonWebTokenError")) {
      err.message = "Invalid token. Please log in again!";
      return res.status(401).json({
        status: "fail",
        message: err.message,
      });
    } else if ((err.name = "TokenExpiredError")) {
      err.message = "Token expired. Please log in again!";
      return res.status(401).json({
        status: "fail",
        message: err.message,
      });
    }
    res.status(500).json({
      status: "success",
      message: "Something went wrong!",
    });
  }
};

//Verify an email address
exports.verifyEmail = async (req, res) => {
  try {
    //const status = "active";
    const { secretCode } = req.params;

    const hashedToken = encryption(secretCode);

    const user = await User.findOne({
      verificationToken: hashedToken,
      verificationTokenExpires: { $gt: Date.now() },
    });

    //check if a user exist
    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "Token is invalid or has expired",
      });
    }

    //Activates user
    user.status = "active";
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;

    await user.save({ validateModifiedOnly: true });

    return res.status(200).json({
      status: "success",
      message: "You can now login",
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      error: "An error occured while verifying your email, try again!",
    });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.json({
        status: "fail",
        message: "There is no user with this email address",
      });
    }

    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    //sending to user email
    const resetURL = `${req.protocol}://${req.get(
      "host"
    )}/api/user/resetPassword/${resetToken}`;

    const message = `<p>Forgot your password? Send a password and it confirmation password to this link: ${resetURL}. \n <br /> If you didn't reset your password please ignore this email.</p>`;

    await sendEmail({
      email: user.email,
      subject:
        "Petra University. Your password reset token (valid for 10 minutes)",
      message,
    });

    res.status(200).json({
      status: "success",
      message: "Token sent to email",
    });
  } catch (err) {
    user.createPasswordResetToken = undefined;
    user.createPasswordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    res.status(500).json({
      status: "fail",
      message: "There was an error sending the email. Try again later!",
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { password, passwordConfirm } = req.body;
    if (!password || !passwordConfirm) {
      return res.status(400).json({
        status: "fail",
        message: "Please provide password and confirm the password!",
      });
    }
    if (!(password === passwordConfirm)) {
      return res.status(400).json({
        status: "fail",
        message: "Password is not the same",
      });
    }
    //encrypting the token from the user
    const hashedToken = encryption(req.params.token);

    //checking if the user exist and if the token has not expired
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    //does user exist?
    if (!user) {
      return res.status(400).json({
        status: "fail",
        message: "Token is invalid or has expired",
      });
    }

    user.password = password;
    user.passwordConfirm = passwordConfirm;

    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    const token = signToken(user._id);
    return res.status(200).json({
      status: "success",
      token,
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: "Something went wrong, try again!",
    });
  }
};

exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, password, passwordConfirm } = req.body;

    if (!password || !passwordConfirm || password.length < 8) {
      return res.status(400).json({
        status: "fail",
        message:
          "Please provide password and confirm the password, it must not be less than 8!",
      });
    }
    if (!(password === passwordConfirm)) {
      return res.status(400).json({
        status: "fail",
        message: "Password is not the same",
      });
    }
    //search for user from collections
    const user = await User.findById(req.user.id).select("+password");

    //check if password matches the one in the databse
    if (!(await user.correctPassword(currentPassword, user.password))) {
      return res.status(401).json({
        status: "fail",
        message: "Your current password is wrong",
      });
    }

    user.password = password;
    user.passwordConfirm = passwordConfirm;
    await user.save({ validateModifiedOnly: true });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      status: "fail",
      message: "Something went wrong, try again",
      error: err.message,
    });
  }
};

exports.resendVerificationEmail = async (req, res) => {
  try {
    //This creates a random code to be sent along for verification
    const randomToken = crypto.randomBytes(32).toString("hex");
    const verificationToken = encryption(randomToken);

    //Destructure user from request
    const { email, userId } = req.params;
    //Search for user in the collections

    const user = await User.findById(userId);

    user.verificationToken = verificationToken;
    await user.save({ validateModifiedOnly: true });

    //The URL sent to the email of the user
    const verifyEmailAddress = `${req.protocol}://${req.get(
      "host"
    )}/api/auth/user/verification/verify-account/${userId}/${randomToken}`;

    //the message sent along with the url for verification
    const message = `<p>Click this link to verify: ${verifyEmailAddress} to confirm your email and continue with your set up. \n <br />If you didn't sign up for Petra University please ignore this email.</p>`;
    const html = `<p >Click this link to verify: <a href=${verifyEmailAddress}>${verifyEmailAddress} </a>to confirm your email and continue with your set up. \n <br /> If you didn't sign up for Petra University please ignore this email.</p>`;

    //email sent here
    await sendEmail({
      email: email,
      subject:
        " Token Resent, Petra Univeristy, confirm  Email  (valid for an hour)",
      html,
      message,
    });

    res.status(201).json({
      status: "success",
      message: "Check your email inbox for email confirmation",
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: "There was an error sending the email, try again!",
    });
  }
};
