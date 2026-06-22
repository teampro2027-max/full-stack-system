/**
 * Test script - Email OTP shaqaynta hubinta
 * Run: node test-email.js
 */
const dotenv = require('dotenv');
dotenv.config({ override: true });

const nodemailer = require('nodemailer');

const testEmail = async () => {
    console.log('\n========================================');
    console.log('📧 EMAIL OTP TEST SCRIPT');
    console.log('========================================\n');

    // 1) Hubi SMTP credentials
    const smtpEmail = process.env.SMTP_EMAIL;
    const smtpPassword = process.env.SMTP_PASSWORD;

    console.log('1️⃣  SMTP Email:', smtpEmail || '❌ MISSING!');
    console.log('2️⃣  SMTP Password:', smtpPassword ? `✅ Set (${smtpPassword.length} chars)` : '❌ MISSING!');
    console.log('');

    if (!smtpEmail || !smtpPassword) {
        console.error('❌ SMTP credentials missing in .env file!');
        process.exit(1);
    }

    // 2) Transporter samee
    console.log('3️⃣  Creating Gmail transporter...');
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: smtpEmail,
            pass: smtpPassword,
        },
    });

    // 3) Connection verify samee
    console.log('4️⃣  Verifying SMTP connection...');
    try {
        await transporter.verify();
        console.log('   ✅ SMTP connection SUCCESSFUL! Gmail credentials are valid.\n');
    } catch (verifyError) {
        console.error('   ❌ SMTP connection FAILED!\n');
        console.error('   Error:', verifyError.message);
        console.error('');
        
        if (verifyError.message.includes('Invalid login') || verifyError.message.includes('535')) {
            console.error('   🔑 SABABTA: Gmail App Password-ku khalad yahay ama wuu dhacay.');
            console.error('   📋 XALKA:');
            console.error('      1. Tag https://myaccount.google.com/apppasswords');
            console.error('      2. App Password cusub samee');
            console.error('      3. .env file-ka ku beddel password-ka cusub (space-yada la\'aan)');
        } else if (verifyError.message.includes('ENOTFOUND') || verifyError.message.includes('ETIMEDOUT')) {
            console.error('   🌐 SABABTA: Internet connection ma jirto ama firewall ayaa xidhan.');
        } else if (verifyError.message.includes('less secure')) {
            console.error('   🔒 SABABTA: 2-Step Verification la\'aan App Password ma shaqeeyso.');
            console.error('   📋 XALKA: Enable 2FA oo kadib App Password samee.');
        }
        
        process.exit(1);
    }

    // 4) Test email dir
    const testOtp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('5️⃣  Sending test OTP email...');
    console.log(`   To: ${smtpEmail} (adigaa u direynaaya naftaada)`);
    console.log(`   OTP: ${testOtp}`);
    console.log('');

    try {
        const info = await transporter.sendMail({
            from: `"BillTrack Pro Test" <${smtpEmail}>`,
            to: smtpEmail, // Naftaada u dir test ahaan
            subject: 'TEST: BillTrack Pro OTP Code',
            text: `Test OTP code: ${testOtp}`,
            html: `
                <div style="font-family: Arial; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; max-width: 400px;">
                    <h2 style="color: #4f46e5;">BillTrack Pro - Test</h2>
                    <p>Test OTP koodkaagu waa:</p>
                    <div style="font-size: 36px; font-weight: bold; letter-spacing: 10px; text-align: center; padding: 15px; background: #f3f4f6; border-radius: 8px; font-family: monospace;">
                        ${testOtp}
                    </div>
                    <p style="color: green; font-weight: bold; margin-top: 15px;">✅ Email-ku wuu shaqaynayaa!</p>
                </div>
            `,
        });

        console.log('========================================');
        console.log('✅ EMAIL SENT SUCCESSFULLY!');
        console.log('========================================');
        console.log(`   Message ID: ${info.messageId}`);
        console.log(`   Response: ${info.response}`);
        console.log('');
        console.log('📬 Hubi Gmail-kaaga (Inbox ama Spam folder)');
        console.log('   Email: ' + smtpEmail);
        console.log('');
        console.log('🎉 OTP system-ku wuu shaqaynayaa!');
        console.log('   Server-ka dib u bilow: node server.js');
        console.log('========================================\n');
    } catch (sendError) {
        console.error('========================================');
        console.error('❌ EMAIL SENDING FAILED!');
        console.error('========================================');
        console.error('   Error:', sendError.message);
        console.error('========================================\n');
    }
};

testEmail();
