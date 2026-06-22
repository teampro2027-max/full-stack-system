const nodemailer = require('nodemailer');

/**
 * Function-kan wuxuu OTP u dirayaa Gmail-ka isticmaalaha
 */
const sendOTP = async (email, otp) => {
  try {
    if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
      throw new Error('SMTP credentials missing in .env file');
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const mailOptions = {
      from: `"BillTrack Pro Support" <${process.env.SMTP_EMAIL}>`,
      to: email,
      subject: 'BillTrack Pro: Koodka Xaqiijinta Koontada (Verification OTP)',
      text: `Haye, koodkaaga xaqiijinta koontada BillTrack Pro waa: ${otp}. Koodhan wuxuu shaqaynayaa muddo 10 daqiiqo ah. Fadlan ha cidna la wadaagin koodkan. Mahadsanid, Kooxda BillTrack Pro.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px 20px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff; color: #1f2937;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h2 style="color: #4f46e5; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">BillTrack Pro</h2>
            <p style="color: #6b7280; font-size: 14px; margin: 5px 0 0 0;">Maareynta Biilasha si Fudud</p>
          </div>
          <div style="padding: 20px; border-radius: 8px; background-color: #f9fafb; border: 1px solid #f3f4f6;">
            <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">Waad ku mahadsan tahay is-diiwaangelintaada ama gelitaankaaga. Fadlan isticmaal koodka hoose si aad u xaqiijiso email-kaaga:</p>
            <div style="font-size: 36px; font-weight: 800; letter-spacing: 12px; padding: 18px; background: #ffffff; text-align: center; color: #111827; border-radius: 8px; border: 1px solid #e5e7eb; margin: 10px 0 20px 0; font-family: monospace;">
              ${otp}
            </div>
            <p style="font-size: 13px; color: #dc2626; font-weight: bold; margin: 0 0 8px 0; text-align: center;">Koodkan wuxuu dhacayaa 10 daqiiqo ka dib.</p>
            <p style="font-size: 14px; line-height: 1.5; color: #4b5563; margin: 0;">Fadlan ha la wadaagin koodkan cid kale si aad u ilaaliso badbaadada koontadaada.</p>
          </div>
          <div style="margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px; font-size: 12px; color: #9ca3af; text-align: center; line-height: 1.5;">
            <p style="margin: 0 0 8px 0;">BillTrack Pro Corp. &copy; 2026. All rights reserved.</p>
            <p style="margin: 0;">Haddii aadan adigu is-diiwaangelin ama aadan codsan koodkan, fadlan iska indhatir email-kan.</p>
          </div>
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
    if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
      console.warn('SMTP credentials missing, skipping bill reminder email');
      return false;
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const mailOptions = {
      from: `"BillTrack Pro" <${process.env.SMTP_EMAIL}>`,
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
    if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
      throw new Error('SMTP credentials missing in .env file');
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const mailOptions = {
      from: `"BillTrack Pro Support" <${process.env.SMTP_EMAIL}>`,
      to: email,
      subject: 'BillTrack Pro: Dib-u-dejinta Password-ka (Password Reset OTP)',
      text: `Haye, koodkaaga dib-u-dejinta password-ka BillTrack Pro waa: ${otp}. Koodhan wuxuu shaqaynayaa muddo 10 daqiiqo ah. Fadlan ha cidna la wadaagin koodkan. Mahadsanid, Kooxda BillTrack Pro.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px 20px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff; color: #1f2937;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h2 style="color: #4f46e5; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">BillTrack Pro</h2>
            <p style="color: #6b7280; font-size: 14px; margin: 5px 0 0 0;">Maareynta Biilasha si Fudud</p>
          </div>
          <div style="padding: 20px; border-radius: 8px; background-color: #f9fafb; border: 1px solid #f3f4f6;">
            <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">Fadlan isticmaal koodka hoose si aad dib ugu dejiso password-kaaga:</p>
            <div style="font-size: 36px; font-weight: 800; letter-spacing: 12px; padding: 18px; background: #ffffff; text-align: center; color: #111827; border-radius: 8px; border: 1px solid #e5e7eb; margin: 10px 0 20px 0; font-family: monospace;">
              ${otp}
            </div>
            <p style="font-size: 13px; color: #dc2626; font-weight: bold; margin: 0 0 8px 0; text-align: center;">Koodkan wuxuu dhacayaa 10 daqiiqo ka dib.</p>
            <p style="font-size: 14px; line-height: 1.5; color: #4b5563; margin: 0;">Fadlan ha la wadaagin koodkan cid kale si aad u ilaaliso badbaadada koontadaada.</p>
          </div>
          <div style="margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px; font-size: 12px; color: #9ca3af; text-align: center; line-height: 1.5;">
            <p style="margin: 0 0 8px 0;">BillTrack Pro Corp. &copy; 2026. All rights reserved.</p>
            <p style="margin: 0;">Haddii aadan adigu codsan koodkan, fadlan iska indhatir email-kan.</p>
          </div>
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