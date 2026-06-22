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
      host: 'smtp.gmail.com',
      port: 465, // Si degdeg ah ayuu ugu dirayaa port-gan
      secure: true, // Wuxuu isticmaalayaa SSL toos ah
      auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS,
      },
      connectionTimeout: 20000,
      greetingTimeout: 20000,
      socketTimeout: 20000,
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
    return false; // Hadda wuu fashilmayaa haddii emailka uusan dhab ahaan u dirmin
  }
};

/**
 * Wuxuu ogeysiin u dirayaa isticmaalaha in biilkii 30-ka maalmood uu dhamaaday
 */
const sendBillReminderEmail = async (email, userName, billTitle, amount) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('SMTP credentials missing, skipping bill reminder email');
      return false;
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"BillTrack Pro" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Xasuusin: Biilkaaga "${billTitle}" waa diyaar`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #4F46E5;">BillTrack Pro</h2>
          <p>Haye <b>${userName}</b>,</p>
          <p>Waxaannu ku xasuusinaynaa in 30-kii maalmood ee biilkaaga <b>"${billTitle}"</b> uu soo dhammaaday, haatanna la gaaray xilligii bixinta.</p>
          <div style="font-size: 24px; font-weight: bold; padding: 20px; background: #f4f4f4; text-align: center; color: #111827; border-radius: 8px;">
            Lacagta la rabo: $${amount}
          </div>
          <p style="margin-top: 20px;">Fadlan ka bixi biilkan app-ka gudihiisa.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #9CA3AF;">Waad ku mahadsan tahay isticmaalka BillTrack Pro.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Bill reminder email sending failed:', error);
    return false;
  }
};

const sendResetOTP = async (email, otp) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error('SMTP credentials are missing in .env file');
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS,
      },
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 5000,
    });

    const mailOptions = {
      from: `"BillTrack Pro" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Koodka Dib-u-dejinta Password-ka (OTP Code)',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #4F46E5;">BillTrack Pro</h2>
          <p>Fadlan isticmaal koodka hoose si aad dib ugu dejiso password-kaaga:</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 10px; padding: 20px; background: #f4f4f4; text-align: center; color: #111827; border-radius: 8px;">
            ${otp}
          </div>
          <p style="margin-top: 20px; color: #6B7280;">Koodkan wuxuu dhacayaa 10 daqiiqo ka dib.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #9CA3AF;">Haddii aadan adigu codsan dib-u-dejinta password-ka, fadlan iska indhatir email-kan.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Password reset email sending failed:', error);
    return false;
  }
};

module.exports = { sendOTP, sendResetOTP, sendBillReminderEmail };