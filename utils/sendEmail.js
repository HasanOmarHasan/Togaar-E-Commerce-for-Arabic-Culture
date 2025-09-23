const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    service: process.env.SMTP_SERVICE,
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_PORT === 465,

    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
    pool: true,
    maxConnections: 10,
    maxMessages: 500,
  });

  const mailOptions = {
    from: `${process.env.APP_NAME} <${process.env.SMTP_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html || options.message,
  };

  await transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
    } else {
      console.log(`Email sent: ${info.response}`);
    }
  });
};

module.exports = sendEmail;




// const SibApiV3Sdk = require("@getbrevo/brevo");

// const sendEmail = async (options) => {
//   try {
//     // Initialize API client
//     const client = new SibApiV3Sdk.TransactionalEmailsApi();
//     client.setApiKey(
//       SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey,
//       process.env.BREVO_API_KEY
//     );

//     // Email payload
//     const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
//     sendSmtpEmail.sender = { 
//       name: process.env.APP_NAME, 
//       email: process.env.BREVO_EMAIL_FROM 
//     };
//     sendSmtpEmail.to = [{ email: options.email }];
//     sendSmtpEmail.subject = options.subject;
//     sendSmtpEmail.htmlContent = options.html || `<p>${options.message}</p>`;
//     sendSmtpEmail.textContent = options.message;

//     // Send email
//     const data = await client.sendTransacEmail(sendSmtpEmail);
//     console.log("✅ Email sent successfully:", data.messageId || data);
//   } catch (error) {
//     console.error("❌ Email sending failed:", error.response?.body || error);
//   }
// };

// module.exports = sendEmail;
