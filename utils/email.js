const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  //create nodemailer transporter
  const transporter = nodemailer.createTransport({
    host: process.env.HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.USER_NAME,
      pass: process.env.API_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: options.email,
    subject: options.subject,
    html: options.html,
    text: options.message,
  };

  //sending the email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
