const mongoose = require('mongoose');
require('dotenv').config();
const Bill = require('./models/Bill');
(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fullstack');

    const now = new Date();
    console.log('Now:', now.toISOString());

    const bills = await Bill.find({ notificationDate: { $exists: true, $ne: null } })
      .sort({ notificationDate: 1 })
      .limit(50)
      .lean();
    console.log('Found', bills.length, 'bills with notificationDate');
    bills.forEach((b) => {
      console.log('ID=', b._id.toString());
      console.log(' title=', b.title);
      console.log(' status=', b.status);
      console.log(' dueDate=', b.dueDate?.toISOString());
      console.log(' notificationDate=', b.notificationDate?.toISOString());
      console.log(' amount=', b.amount);
      console.log('---');
    });

    const dueNow = await Bill.find({ notificationDate: { $lte: now }, status: 'paid' })
      .limit(20)
      .lean();
    console.log('Paid bills with notificationDate <= now:', dueNow.length);
    dueNow.forEach((b) => console.log('PAID', b._id.toString(), b.title, b.notificationDate?.toISOString(), b.status));
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
})();
