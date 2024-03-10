const nodemailer = require('nodemailer');

const sendEmail = async option => {
    //(1) Create a transporter 
    var transport = nodemailer.createTransport({
        host: "sandbox.smtp.mailtrap.io",
        port: 2525,
        auth: {
          user: "",
          pass: ""
        }
      });
 
    //(2) Define email option
    const emailOption = {
        from:'Magic Elves <kunjsharma3322@gmail.com>',// sender address
        to:'Mailtrap Inbox <kumarajay.rs3322@gmail.com>',
        subject: option.subject,
        text: option.text
    };
 
    //(3) Actually send the email
    await transport.sendMail(emailOption);
};

module.exports = sendEmail;
