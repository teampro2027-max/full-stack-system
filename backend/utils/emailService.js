const nodemailer = require('nodemailer');

/**
 * Function-kan wuxuu OTP u dirayaa Gmail-ka isticmaalaha
 */
const sendOTP = async (email, otp) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error('SMTP credentials are missing in .env file');
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        // Ku dar kuwan .env file-kaaga
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS, // Isticmaal "App Password" ee Gmail-ka
      },
    });

    const mailOptions = {
      from: `"BillTrack Pro" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Xaqiijinta Koontada (OTP Code)',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #4F46E5;">BillTrack Pro</h2>
          <p>Waad ku mahadsantahay is-diiwaangelintaada. Fadlan isticmaal koodka hoose si aad u xaqiijiso email-kaaga:</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 10px; padding: 20px; background: #f4f4f4; text-align: center; color: #111827; border-radius: 8px;">
            ${otp}
          </div>
          <p style="margin-top: 20px; color: #6B7280;">Koodkan wuxuu dhacayaa 10 daqiiqo ka dib.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #9CA3AF;">Haddii aadan adigu is-diiwaangelin, fadlan iska indhatir email-kan.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
};

module.exports = { sendOTP };