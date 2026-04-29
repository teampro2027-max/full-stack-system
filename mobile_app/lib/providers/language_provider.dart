import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class LanguageProvider with ChangeNotifier {
  String _lang = 'en';
  String get lang => _lang;

  final Map<String, Map<String, String>> _translations = {
    'en': {
      'appTitle': 'MultiBill',
      'myBills': 'My Bills',
      'dashboard': 'Dashboard',
      'addBill': 'Add Bill',
      'editBill': 'Edit Bill',
      'payNow': 'Pay Now',
      'paymentHistory': 'Payment History',
      'profile': 'Profile',
      'settings': 'Settings',
      'logout': 'Logout',
      'totalDue': 'Total Due',
      'upcoming': 'Upcoming Bills',
      'overdue': 'Overdue',
      'paid': 'Paid',
      'unpaid': 'Unpaid',
      'amount': 'Amount',
      'dueDate': 'Due Date',
      'category': 'Category',
      'title': 'Title',
      'electricity': 'Electricity Bill',
      'water': 'Water Bill',
      'internet': 'Internet Bill',
      'rent': 'Rent Payment',
      'school_fees': 'School Fees',
      'mobile_postpaid': 'Mobile Postpaid',
      'tv_subscription': 'TV Subscription',
      'waste_collection': 'Waste Collection',
      'loan_installment': 'Loan Installment',
      'government_license': 'Government License',
      'payAllNow': 'Pay All Now',
      'evcPayment': 'WaafiPay Wallet',
      'stripePayment': 'Card Payment (Stripe)',
      'receipt': 'Download Receipt',
      'noPayments': 'No payment history yet',
      'noBills': 'No bills found',
      'success': 'Payment Successful!',
      'failed': 'Payment Failed',
      'pending': 'Pending',
      'recurring': 'Recurring',
      'monthly': 'Monthly',
      'yearly': 'Yearly',
      'language': 'Language',
      'mfa': 'Two-Factor Auth',
      'notifications': 'Notifications',
      'noNotifications': 'No notifications yet',
      'phoneNumber': 'Phone Number',
      'reports': 'Reports',
      'general': 'General',
      'security': 'Security',
      'info': 'Information',
      'fullName': 'Full Name',
      'phoneNumber': 'Phone Number',
      'account': 'Account',
      'update': 'Update',
      'save': 'Save Changes',
      'paymentSuccessful': 'Payment Successful!',
      'paymentFailed': 'Payment Failed!',
      'paymentCompleted': 'Payment completed successfully.',
      'fillAllFields': 'Please fill all required fields.',
      'edit': 'Edit',
      'changePassword': 'Change Password',
      'newPassword': 'New Password',
      'uploadPhoto': 'Upload Profile Picture',
      'receiverNumber': 'Receiver Number',
      'amountTooSmall': 'Amount must be greater than 0.01.',
    },
    'so': {
      'appTitle': 'MultiBill',
      'myBills': 'Biilashaygii',
      'dashboard': 'Guriga',
      'addBill': 'Ku dar Biil',
      'editBill': 'Wax ka beddel Biilka',
      'payNow': 'Hada Bixi',
      'paymentHistory': 'Taariikhda Lacag Bixinta',
      'profile': 'Astaanta',
      'settings': 'Dejinta',
      'logout': 'Ka bixi',
      'totalDue': 'Wadarta Laga Rabo',
      'upcoming': 'Biilasha Soo Socda',
      'overdue': 'Wakhtigeeda Dhaafay',
      'paid': 'La Bixiyay',
      'unpaid': 'La Bixin',
      'amount': 'Qaddarka',
      'dueDate': 'Taariikhda Bixinta',
      'category': 'Nooca',
      'title': 'Cinwaanka',
      'electricity': 'Biilka Korontada',
      'water': 'Biilka Biyaha',
      'internet': 'Biilka Internetka',
      'rent': 'Kiro',
      'school_fees': 'Kharashka Dugsiga',
      'mobile_postpaid': 'Taleefoon Biil',
      'tv_subscription': 'Biilka TV',
      'waste_collection': 'Biilka Qashinka',
      'loan_installment': 'Amaah Maalin',
      'government_license': 'Rukhsadda Dowladda',
      'payAllNow': 'Dhamaan Hada Bixi',
      'evcPayment': 'Lacag Bixin WaafiPay',
      'stripePayment': 'Kaarka Lacag Bixin',
      'receipt': 'Soo Deji Rasiidhka',
      'noPayments': 'Waxba lacag bixin kama jirto',
      'noBills': 'Biil kuma jiro',
      'success': 'Lacag Bixintu Guuleysatay!',
      'failed': 'Lacag Bixintu Ku Guul Daratay',
      'pending': 'Sugid',
      'recurring': 'Soo Noqnoqda',
      'monthly': 'Bilowga',
      'yearly': 'Sannadkii',
      'language': 'Luqadda',
      'mfa': 'Xaqiijin Laba Tallaabo',
      'notifications': 'Ogeysiiyada',
      'noNotifications': 'Weli ma jiraan ogeysiiyo',
      'phoneNumber': 'Lambaraha Telefoonka',
      'reports': 'Warbixinada',
      'general': 'Guud',
      'security': 'Amniga',
      'info': 'Macluumaadka',
      'fullName': 'Magaca oo Buuxa',
      'phoneNumber': 'Lambarka Taleefonka',
      'account': 'Koontada',
      'update': 'Cusboonaysii',
      'save': 'Kaydi Isbedelka',
      'paymentSuccessful': 'Lacag Bixintu Guuleysatay!',
      'paymentFailed': 'Lacag Bixintu Ku Guul Daratay!',
      'paymentCompleted': 'Lacag bixintu si guul ah ayay u dhacday.',
      'fillAllFields': 'Fadlan buuxi dhammaan goobaha loo baahan yahay.',
      'edit': 'Wax ka beddel',
      'changePassword': 'Baddal Ereyga Sirta ah',
      'newPassword': 'Erey Sir ah oo Cusub',
      'uploadPhoto': 'Soo geli Sawirka Profile-ka',
      'receiverNumber': 'Lambarka Loo Diray',
      'amountTooSmall': 'Qaddarka waa inuu ka weynaadaa 0.01.',
    },
  };

  LanguageProvider() {
    _loadLang();
  }

  Future<void> _loadLang() async {
    final prefs = await SharedPreferences.getInstance();
    _lang = prefs.getString('lang') ?? 'en';
    notifyListeners();
  }

  Future<void> setLang(String lang) async {
    _lang = lang;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('lang', lang);
    notifyListeners();
  }

  String t(String key) =>
      _translations[_lang]?[key] ?? _translations['en']?[key] ?? key;
}
