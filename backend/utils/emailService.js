const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const https = require('https');
const dns = require('dns').promises;

const isOfflineMode = () => process.env.OFFLINE_MODE === 'true';
const smtpTimeout = () => Number(process.env.SMTP_TIMEOUT_MS || 8000);

const hasSmtpCredentials = () => Boolean(process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD);
const allowEmailFallback = () => process.env.ALLOW_EMAIL_FALLBACK !== 'false';

const parseFromAddress = (from) => {
  const match = String(from || '').match(/^\s*"?([^"<]*)"?\s*<([^>]+)>\s*$/);
  if (!match) {
    return {
      name: process.env.FROM_NAME || 'BillTrack Pro',
      email: process.env.FROM_EMAIL || process.env.SMTP_EMAIL || 'no-reply@billtrackpro.com',
    };
  }

  return {
    name: match[1].trim() || process.env.FROM_NAME || 'BillTrack Pro',
    email: match[2].trim(),
  };
};

const getFromAddress = (fromName) => {
  const senderName = process.env.FROM_NAME || fromName || 'BillTrack Pro';
  const senderEmail = process.env.FROM_EMAIL || process.env.SMTP_EMAIL || 'no-reply@billtrackpro.com';
  return `${senderName} <${senderEmail}>`;
};

const httpPostJson = ({ hostname, path: requestPath, headers = {}, body }) =>
  new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const req = https.request(
      {
        method: 'POST',
        hostname,
        path: requestPath,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          ...headers,
        },
        timeout: Number(process.env.EMAIL_API_TIMEOUT_MS || 12000),
      },
      (res) => {
        let data = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          resolve({ statusCode: res.statusCode, body: data });
        });
      }
    );

    req.on('timeout', () => {
      req.destroy(new Error('Email API request timed out'));
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
const httpPostJsonUrl = async (urlString, { headers = {}, body, redirects = 3 } = {}) => {
  const target = new URL(urlString);
  if (target.protocol !== 'https:') {
    throw new Error('Email webhook URL must use HTTPS.');
  }
  const payload = JSON.stringify(body || {});
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        method: 'POST',
        hostname: target.hostname,
        path: `${target.pathname}${target.search}`,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          ...headers,
        },
        timeout: Number(process.env.EMAIL_API_TIMEOUT_MS || 12000),
      },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && redirects > 0) {
          res.resume();
          const nextUrl = new URL(res.headers.location, target).toString();
          resolve(httpPostJsonUrl(nextUrl, { headers, body, redirects: redirects - 1 }));
          return;
        }
        let data = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          resolve({ statusCode: res.statusCode, body: data });
        });
      }
    );
    req.on('timeout', () => {
      req.destroy(new Error('Email webhook request timed out'));
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
};


const sendWithResend = async ({ to, subject, text, html, from }) => {
  const apiKey = String(process.env.RESEND_API_KEY || '').trim();
  if (!apiKey) throw new Error('RESEND_API_KEY is not configured.');

  const response = await httpPostJson({
    hostname: 'api.resend.com',
    path: '/emails',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: {
      from,
      to: [to],
      subject,
      text,
      html,
    },
  });

  if (response.statusCode >= 200 && response.statusCode < 300) {
    console.log(`Email sent to ${to} using Resend API`);
    return true;
  }

  throw new Error(`Resend API failed with HTTP ${response.statusCode}: ${response.body}`);
};

const sendWithBrevo = async ({ to, subject, text, html, from }) => {
  const apiKey = String(process.env.BREVO_API_KEY || '').trim();
  if (!apiKey) throw new Error('BREVO_API_KEY is not configured.');

  const parsedFrom = parseFromAddress(from);
  const response = await httpPostJson({
    hostname: 'api.brevo.com',
    path: '/v3/smtp/email',
    headers: {
      'api-key': process.env.BREVO_API_KEY,
    },
    body: {
      sender: parsedFrom,
      to: [{ email: to }],
      subject,
      htmlContent: html,
      textContent: text,
    },
  });

  if (response.statusCode >= 200 && response.statusCode < 300) {
    console.log(`Email sent to ${to} using Brevo API`);
    return true;
  }

  throw new Error(`Brevo API failed with HTTP ${response.statusCode}: ${response.body}`);
};

const sendWithSendGrid = async ({ to, subject, text, html, from }) => {
  const apiKey = String(process.env.SENDGRID_API_KEY || '').trim();
  if (!apiKey) throw new Error('SENDGRID_API_KEY is not configured.');

  const parsedFrom = parseFromAddress(from);
  const content = [];
  if (text) content.push({ type: 'text/plain', value: text });
  if (html) content.push({ type: 'text/html', value: html });

  const response = await httpPostJson({
    hostname: 'api.sendgrid.com',
    path: '/v3/mail/send',
    headers: {
      Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
    },
    body: {
      personalizations: [{ to: [{ email: to }] }],
      from: parsedFrom,
      subject,
      content,
    },
  });

  if (response.statusCode >= 200 && response.statusCode < 300) {
    console.log(`Email sent to ${to} using SendGrid API`);
    return true;
  }

  throw new Error(`SendGrid API failed with HTTP ${response.statusCode}: ${response.body}`);
};

const sendWithGoogleScript = async ({ to, subject, text, html, from }) => {
  const webhookUrl = String(
    process.env.GOOGLE_SCRIPT_EMAIL_URL ||
    process.env.GMAIL_WEBHOOK_URL ||
    process.env.GOOGLE_APPS_SCRIPT_URL ||
    ''
  ).trim();
  if (!webhookUrl) throw new Error('GOOGLE_SCRIPT_EMAIL_URL is not configured.');

  const secret = String(
    process.env.GOOGLE_SCRIPT_EMAIL_SECRET ||
    process.env.GMAIL_WEBHOOK_SECRET ||
    ''
  ).trim();
  const parsedFrom = parseFromAddress(from);
  const response = await httpPostJsonUrl(webhookUrl, {
    headers: secret ? { 'X-Email-Secret': secret } : {},
    body: {
      secret,
      to,
      subject,
      text,
      html,
      fromName: parsedFrom.name,
      fromEmail: parsedFrom.email,
    },
  });

  if (response.statusCode >= 200 && response.statusCode < 300) {
    console.log(`Email sent to ${to} using Google Apps Script webhook`);
    return true;
  }

  throw new Error(`Google Apps Script email webhook failed with HTTP ${response.statusCode}: ${response.body}`);
};

const getPreferredApiSenders = () => {
  const provider = (process.env.EMAIL_PROVIDER || '').trim().toLowerCase();
  const senders = {
    resend: sendWithResend,
    brevo: sendWithBrevo,
    sendgrid: sendWithSendGrid,
  };

  if (provider) {
    if (provider === 'smtp') return [];
    if (senders[provider]) {
      const preferred = [senders[provider]];
      Object.keys(senders).forEach((providerKey) => {
        if (providerKey === provider) return;
        if (process.env[`${providerKey.toUpperCase()}_API_KEY`]) {
          preferred.push(senders[providerKey]);
        }
      });
      return preferred;
    }
  }

  const preferred = [];
  if (process.env.RESEND_API_KEY) preferred.push(sendWithResend);
  if (process.env.BREVO_API_KEY) preferred.push(sendWithBrevo);
  if (process.env.SENDGRID_API_KEY) preferred.push(sendWithSendGrid);
  return preferred;
};

const getSmtpCandidates = async () => {
  if (!hasSmtpCredentials()) return [];

  const auth = {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  };
  const common = {
    auth,
    connectionTimeout: smtpTimeout(),
    greetingTimeout: smtpTimeout(),
    socketTimeout: smtpTimeout(),
  };

  if (process.env.SMTP_SERVICE) {
    return [{ label: process.env.SMTP_SERVICE, options: { service: process.env.SMTP_SERVICE, ...common } }];
  }

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT || 465);
  const secure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE !== 'false' : port === 465;
  const candidates = [
    { label: `${host}:${port}`, options: { host, port, secure, ...common } },
  ];

  const isGmail = host.includes('gmail.com');
  if (isGmail && process.env.SMTP_DISABLE_GMAIL_FALLBACKS !== 'true') {
    candidates.push(
      { label: 'gmail-service', options: { service: 'gmail', ...common } },
      { label: 'gmail-465-ipv4', options: { host: 'smtp.gmail.com', port: 465, secure: true, family: 4, ...common } },
      { label: 'gmail-587-ipv4', options: { host: 'smtp.gmail.com', port: 587, secure: false, family: 4, ...common } }
    );

    try {
      const [ip] = await dns.resolve4('smtp.gmail.com');
      if (ip) {
        candidates.push(
          {
            label: 'gmail-465-direct-ipv4',
            options: { host: ip, port: 465, secure: true, tls: { servername: 'smtp.gmail.com' }, ...common },
          },
          {
            label: 'gmail-587-direct-ipv4',
            options: { host: ip, port: 587, secure: false, tls: { servername: 'smtp.gmail.com' }, ...common },
          }
        );
      }
    } catch (err) {
      console.error('Could not resolve smtp.gmail.com IPv4 address:', err.message);
    }
  }

  const seen = new Set();
  return candidates.filter((candidate) => {
    const key = JSON.stringify(candidate.options);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const sendWithSmtp = async ({ to, subject, text, html, from }) => {
  const candidates = await getSmtpCandidates();
  if (candidates.length === 0) {
    console.error('Email send failed: configure RESEND_API_KEY, BREVO_API_KEY, SENDGRID_API_KEY, or SMTP_EMAIL/SMTP_PASSWORD.');
    return false;
  }

  const errors = [];
  for (const candidate of candidates) {
    try {
      const transporter = nodemailer.createTransport(candidate.options);
      const info = await transporter.sendMail({ from, to, subject, text, html });
      console.log(`Email sent to ${to} using SMTP ${candidate.label}: ${info.messageId}`);
      return true;
    } catch (err) {
      errors.push(`${candidate.label}: ${err.message}`);
    }
  }

  console.error('Email send failed on all SMTP transports:', errors.join(' | '));
  return false;
};

const logOfflineOTP = (email, otp, type) => {
  const logFile = path.join(__dirname, '..', 'offline_otps.txt');
  const timestamp = new Date().toISOString();
  const entry = `[${timestamp}] TYPE: ${type} | EMAIL: ${email} | OTP CODE: ${otp}\n`;

  try {
    fs.appendFileSync(logFile, entry, 'utf8');
    console.log('\n================================================================');
    console.log('[OFFLINE OTP MOCK]');
    console.log('----------------------------------------------------------------');
    console.log(`Target Email : ${email}`);
    console.log(`OTP Code     : ${otp}`);
    console.log(`Email Type   : ${type}`);
    console.log('Logged to    : backend/offline_otps.txt');
    console.log('================================================================\n');
  } catch (err) {
    console.error('Failed to write offline OTP to file:', err);
  }
};

const sendEmail = async ({ to, subject, text, html, fromName } = {}) => {
  const from = getFromAddress(fromName);

  try {
    if (isOfflineMode()) {
      console.log('\n================================================================');
      console.log('[OFFLINE EMAIL MOCK]');
      console.log('----------------------------------------------------------------');
      console.log(`From    : ${from}`);
      console.log(`To      : ${to}`);
      console.log(`Subject : ${subject}`);
      console.log(`Text    : ${text || '(HTML Content Sent)'}`);
      console.log('================================================================\n');
      return true;
    }

    const apiSenders = getPreferredApiSenders();
    console.log(`Email send attempt: provider=${process.env.EMAIL_PROVIDER || 'auto'}, from=${from}, apiSenders=${apiSenders.length}`);

    const apiErrors = [];
    for (const apiSender of apiSenders) {
      try {
        const sent = await apiSender({ to, subject, text, html, from });
        if (sent) return true;
      } catch (err) {
        apiErrors.push(err.message);
      }
    }

    if (apiErrors.length > 0) {
      console.error('Email API send failed:', apiErrors.join(' | '));
    }

    const provider = (process.env.EMAIL_PROVIDER || '').trim().toLowerCase();
    if (provider === 'smtp' || getPreferredApiSenders().length === 0) {
      return sendWithSmtp({ to, subject, text, html, from });
    }

    if (hasSmtpCredentials() && allowEmailFallback()) {
      console.warn('Email API failed; SMTP fallback enabled because SMTP credentials are configured.');
      return sendWithSmtp({ to, subject, text, html, from });
    }

    console.error('SMTP fallback disabled or no SMTP credentials are available.');
    return false;
  } catch (err) {
    console.error('Email send failed:', err.message);
    return false;
  }
};

const sendOTP = async (email, otp) => {
  if (isOfflineMode()) {
    logOfflineOTP(email, otp, 'REGISTRATION_OR_LOGIN_OTP');
  }

  const subject = 'BillTrack Pro: Koodka Xaqiijinta Koontada (Verification OTP)';
  const text = `Haye, koodkaaga xaqiijinta koontada BillTrack Pro waa: ${otp}. Koodhan wuxuu shaqaynayaa muddo 10 daqiiqo ah. Fadlan ha cidna la wadaagin koodkan. Mahadsanid, Kooxda BillTrack Pro.`;
  const html = `
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
  `;
  return sendEmail({ to: email, subject, text, html });
};

const sendBillReminderEmail = async (email, userName, billTitle, amount) => {
  const subject = `Xasuusin: Biilkaaga "${billTitle}" waa diyaar`;
  const html = `
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
  `;
  return sendEmail({ to: email, subject, html });
};

const sendResetOTP = async (email, otp) => {
  if (isOfflineMode()) {
    logOfflineOTP(email, otp, 'PASSWORD_RESET_OTP');
  }

  const subject = 'BillTrack Pro: Dib-u-dejinta Password-ka (Password Reset OTP)';
  const text = `Haye, koodkaaga dib-u-dejinta password-ka BillTrack Pro waa: ${otp}. Koodhan wuxuu shaqaynayaa muddo 10 daqiiqo ah. Fadlan ha cidna la wadaagin koodkan. Mahadsanid, Kooxda BillTrack Pro.`;
  const html = `
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
  `;
  return sendEmail({ to: email, subject, text, html });
};

module.exports = { sendEmail, sendOTP, sendResetOTP, sendBillReminderEmail };
