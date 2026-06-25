const EMAIL_WEBHOOK_SECRET = 'change-this-secret';
const TEST_EMAIL = 'updirahman8@gmail.com';

function myFunction() {
  return testSendEmail();
}

function testSendEmail() {
  GmailApp.sendEmail(
    TEST_EMAIL,
    'BillTrack Pro OTP Test',
    'Test OTP code: 123456',
    {
      name: 'BillTrack Pro',
      htmlBody: [
        '<div style="font-family:Arial,sans-serif;padding:20px">',
        '<h2>BillTrack Pro</h2>',
        '<p>Test OTP code:</p>',
        '<div style="font-size:32px;font-weight:bold;letter-spacing:8px">123456</div>',
        '</div>',
      ].join(''),
    }
  );

  return jsonResponse({ success: true, testEmail: TEST_EMAIL });
}

function doPost(e) {
  try {
    const data = JSON.parse((e.postData && e.postData.contents) || '{}');
    const expectedSecret =
      PropertiesService.getScriptProperties().getProperty('EMAIL_WEBHOOK_SECRET') ||
      EMAIL_WEBHOOK_SECRET;

    if (expectedSecret && data.secret !== expectedSecret) {
      return jsonResponse({ success: false, error: 'Unauthorized email request.' });
    }

    if (!data.to || !data.subject || (!data.text && !data.html)) {
      return jsonResponse({ success: false, error: 'Missing email fields.' });
    }

    const options = {
      name: data.fromName || 'BillTrack Pro',
    };

    if (data.html) options.htmlBody = data.html;
    if (data.fromEmail) options.replyTo = data.fromEmail;

    GmailApp.sendEmail(
      data.to,
      data.subject,
      data.text || 'Please view this email in an HTML-capable email client.',
      options
    );

    return jsonResponse({ success: true });
  } catch (err) {
    return jsonResponse({
      success: false,
      error: err && err.message ? err.message : String(err),
    });
  }
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
