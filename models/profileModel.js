const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
    photo: {
      type: String,
      default: "default.jpg",
    },
    surname: {
      type: String,
      required: true,
    },
    othernames: {
      type: String,
      required: true,
    },
    dateofbirth: {
      type: Date,
      required: true,
    },
    gender: {
      type: String,
      required: true,
    },
    maritalstatus: {
      type: String,
      required: true,
    },

    nationality: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    localgov: {
      type: String,
      required: true,
    },
    hometown: {
      type: String,
      required: true,
    },
    currentaddress: {
      type: String,
      required: true,
    },
    programme: {
      type: String,
      required: true,
    },
    contact: {
      type: String,
      required: true,
    },
    entrylevel: {
      type: Number,
      required: true,
      default: 100,
    },
    education: [
      {
        school: {
          type: String,
          required: true,
        },
        degree: {
          type: String,
          required: true,
        },
        from: {
          type: Date,
          required: true,
        },
        to: {
          type: Date,
          require: true,
        },
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

profileSchema.pre(/^find/, function (next) {
  this.populate("user").populate({
    path: "users",
    select: ["email"],
  });
  next();
});

module.exports = Profile = mongoose.model("Profile", profileSchema);
