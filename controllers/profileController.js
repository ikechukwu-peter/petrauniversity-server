const factory = require("./../utils/handlerFactory");
const Profile = require("../models/profileModel");

exports.createProfile = async (req, res) => {
  try {
    // Get fields
    //Initialize an empty object
    const profileFields = {};
    profileFields.user = req.user.id;

    //pass the values into the object
    if (req.body.surname) profileFields.surname = req.body.surname;
    if (req.body.othernames) profileFields.othernames = req.body.othernames;
    if (req.body.dateofbirth) profileFields.dateofbirth = req.body.dateofbirth;
    if (req.body.photo) profileFields.photo = req.body.photo;
    if (req.body.state) profileFields.state = req.body.state;
    if (req.body.nationality) profileFields.nationality = req.body.nationality;
    if (req.body.localgov) profileFields.localgov = req.body.localgov;
    if (req.body.gender) profileFields.gender = req.body.gender;
    if (req.body.maritalstatus)
      profileFields.maritalstatus = req.body.maritalstatus;
    if (req.body.hometown) profileFields.hometown = req.body.hometown;
    if (req.body.currentaddress)
      profileFields.currentaddress = req.body.currentaddress;
    if (req.body.programme) profileFields.programme = req.body.programme;
    if (req.body.contact) profileFields.contact = req.body.contact;
    if (req.body.entrylevel) profileFields.entrylevel = req.body.entrylevel;

    // Education is an object
    profileFields.education = {};
    if (req.body.school) profileFields.education.school = req.body.school;
    if (req.body.degree) profileFields.education.degree = req.body.degree;
    if (req.body.from) profileFields.education.from = req.body.from;
    if (req.body.to) profileFields.education.to = req.body.to;

    let profile = await Profile.findOne({
      user: req.user.id,
    });

    if (profile) {
      // Update
      profile = await Profile.findOneAndUpdate(
        { user: req.user.id },
        { $set: profileFields },
        { new: true }
      );
      return res.json({
        profile,
      });
    } else {
      profile = await Profile.create(profileFields);
      return res.status(200).json({
        status: "success",
        profile,
      });
    }
  } catch (err) {
    let message = "Fill all the required fields";
    err.message = message;
    res.status(401).json({
      status: "fail",
      message: message,
    });
  }
};

//uaser to get their self from their profile
exports.getUser = factory.getOne(Profile);

//user to see all other students
exports.getAllUsers = factory.getAll(Profile);

// Do NOT update passwords with this!
exports.updateUser = factory.updateOne(Profile);

//user to delete their self
exports.deleteUser = factory.deleteOne(Profile);
