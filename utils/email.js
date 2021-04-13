const sgMail = require("@sendgrid/mail");
const sendEmail = async (options) => {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  const msg = {
    to: options.email,
    from: process.env.EMAIL_FROM,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };
  await sgMail.send(msg);
};

module.exports = sendEmail;
