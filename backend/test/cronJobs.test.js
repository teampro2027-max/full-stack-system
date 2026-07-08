const test = require('node:test');
const assert = require('node:assert/strict');
const { resolveReminderBillState } = require('../utils/cronJobs');

test('marks unpaid reminder bills as overdue when reminder time passes', () => {
  const now = new Date('2026-07-08T10:15:00.000Z');
  const bill = {
    status: 'unpaid',
    reminderEnabled: true,
    notificationDate: new Date('2026-07-08T10:00:00.000Z'),
  };

  const result = resolveReminderBillState(bill, now);

  assert.equal(result.status, 'overdue');
  assert.equal(result.shouldNotify, true);
});

test('resets previously paid reminder bills back to unpaid when reminder time passes', () => {
  const now = new Date('2026-07-08T10:15:00.000Z');
  const bill = {
    status: 'paid',
    reminderEnabled: true,
    notificationDate: new Date('2026-07-08T10:00:00.000Z'),
  };

  const result = resolveReminderBillState(bill, now);

  assert.equal(result.status, 'unpaid');
  assert.equal(result.shouldNotify, true);
});
