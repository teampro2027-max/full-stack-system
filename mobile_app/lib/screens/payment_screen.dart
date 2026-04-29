import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../providers/language_provider.dart'; // Import LanguageProvider

class PaymentScreen extends StatefulWidget {
  final Map<String, dynamic> bill;

  const PaymentScreen({Key? key, required this.bill}) : super(key: key);

  @override
  _PaymentScreenState createState() => _PaymentScreenState();
}

class _PaymentScreenState extends State<PaymentScreen> {
  final TextEditingController _amountController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _pinController = TextEditingController();
  bool _isProcessing = false;
  String userPhone =
      "25261XXXXXXX"; // Tani waa in laga soo qaado AuthProvider ama User Profile

  @override
  void initState() {
    super.initState();
    // Saadaalinta lacagta biilka
    // Waxaan hubinaynaa in lacagta ay tahay mid sax ah oo aan ka yarayn 0.01
    _amountController.text = widget.bill['amount']?.toString() ?? "0.00";
    // userPhone = ... (Halkan ku shub lambarka isticmaalaha ee diwaangashan)
  }

  Future<void> _handlePayment() async {
    final amountStr = _amountController.text.trim();
    final receiverPhone = _phoneController.text.trim();
    final lang = Provider.of<LanguageProvider>(context, listen: false);

    // Hubi haddii xogta la geliyay
    if (amountStr.isEmpty || receiverPhone.isEmpty) {
      _showResultDialog(
        false,
        lang.t('paymentFailed'),
        lang.t('fillAllFields'),
      );
      return;
    }

    final double amount = double.tryParse(amountStr) ?? 0.0;
    if (amount <= 0.01) {
      // Minimum amount check
      _showResultDialog(
        false,
        lang.t('paymentFailed'),
        lang.t('amountTooSmall'),
      );
      return;
    }

    // Halkan waxaad ku dari kartaa validation-ka lambarka taleefanka
    // tusaale ahaan, haddii uu yahay 12 lambar oo bilowda 252

    setState(() => _isProcessing = true);

    try {
      // Diyaarinta xogta loo dirayo API-ga
      final payload = {
        'billId': widget.bill['_id'],
        'amount': amountStr,
        'receiverPhone': receiverPhone,
        'description': 'Payment for ${widget.bill['title'] ?? 'Bill'}',
      };

      // U dir API-ga backend-ka
      final response = await ApiService.post('/payments/waafi', payload);

      // Si automatic ah u cusboonaysii xogta Dashboard-ka iyo Bills-ka
      if (mounted) {
        // Halkan ka wac function-ada refresh-ka ee Provider-adaada.
        // Tusaale ahaan: context.read<BillProvider>().fetchBills();
        // context.read<DashboardProvider>().fetchStats();
      }

      if (mounted) {
        _showResultDialog(
          true,
          lang.t('paymentSuccessful'),
          response['message'] ?? lang.t('paymentCompleted'),
        );
        // Ku laabo liiska biilasha oo dib u cusboonaysii
        Navigator.pop(context, true);
      }
    } catch (e) {
      if (mounted)
        _showResultDialog(false, lang.t('paymentFailed'), e.toString());
    } finally {
      if (mounted) setState(() => _isProcessing = false);
    }
  }

  void _showResultDialog(bool success, String title, String message) {
    final lang = Provider.of<LanguageProvider>(context, listen: false);
    showDialog(
      context: context,
      barrierDismissible: false, // User must tap button to close
      builder: (BuildContext context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(15),
          ),
          title: Row(
            children: [
              Icon(
                success ? Icons.check_circle : Icons.cancel,
                color: success ? Colors.green : Colors.red,
                size: 30,
              ),
              const SizedBox(width: 10),
              Text(
                title,
                style: TextStyle(color: success ? Colors.green : Colors.red),
              ),
            ],
          ),
          content: Text(message),
          actions: <Widget>[
            TextButton(
              child: Text(lang.t('ok')),
              onPressed: () {
                Navigator.of(context).pop(); // Close the dialog
              },
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    bool isAlreadyPaid = widget.bill['status'] == 'paid';
    final lang = Provider.of<LanguageProvider>(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.bill['title'] ?? 'Lacag-bixinta'),
        backgroundColor: const Color(0xFF4F46E5),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            // Section 1: Header & Amount Input (Lacagta la arki karo)
            Container(
              padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 24),
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [Color(0xFF4F46E5), Color(0xFF6366F1)],
                ),
                borderRadius: BorderRadius.only(
                  bottomLeft: Radius.circular(32),
                  bottomRight: Radius.circular(32),
                ),
              ),
              child: Column(
                children: [
                  const Text(
                    'Enter Amount (USD)',
                    style: TextStyle(color: Colors.white70, fontSize: 16),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _amountController,
                    textAlign: TextAlign.center,
                    keyboardType: TextInputType.number,
                    obscureText: false,
                    style: const TextStyle(
                      fontSize: 48,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                    decoration: const InputDecoration(
                      prefixIcon: Icon(
                        Icons.monetization_on,
                        color: Colors.white,
                        size: 36,
                      ),
                      hintText: '0.00',
                      hintStyle: TextStyle(color: Colors.white38),
                      // Ka saar midabka cad ee asalka ah
                      filled: true,
                      fillColor: Colors
                          .transparent, // Tani waxay ka saaraysaa midabka cad
                      enabledBorder: InputBorder.none, // Ka saar border-ka
                      focusedBorder: InputBorder
                          .none, // Ka saar border-ka marka la focus-gareeyo
                    ),
                  ),
                ],
              ),
            ),

            // Section 2 & 3: EVC Plus Features (Stripe waa laga saaray)
            Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text(
                    "Ku bixi WaafiPay", // Changed to WaafiPay as per backend
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF1F2937),
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Wallet Indicator
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.green.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Colors.green.withOpacity(0.5)),
                    ),
                    child: Row(
                      children: const [
                        Icon(Icons.account_balance_wallet, color: Colors.green),
                        SizedBox(width: 12),
                        Text(
                          // Changed to WaafiPay Wallet Active
                          "EVC Plus Wallet Active",
                          style: TextStyle(
                            color: Colors.green,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Phone Input
                  TextField(
                    controller: _phoneController,
                    decoration: InputDecoration(
                      labelText: lang.t(
                        'receiverPhoneNumber',
                      ), // Use translation
                      hintText: '25261XXXXXXX',
                      prefixIcon: Icon(Icons.phone_android),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.all(Radius.circular(12)),
                      ),
                    ),
                    keyboardType: TextInputType.phone,
                  ),
                  const SizedBox(height: 20),

                  // Action Button
                  ElevatedButton(
                    onPressed: (_isProcessing || isAlreadyPaid)
                        ? null
                        : _handlePayment,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.green,
                      padding: const EdgeInsets.symmetric(vertical: 18),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                    child: _isProcessing
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(
                              color: Colors.white,
                              strokeWidth: 2,
                            ),
                          )
                        : Text(
                            isAlreadyPaid
                                ? lang.t('billPaidThisMonth')
                                : lang.t('payWithEVC'),
                            style: const TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ), // Use translation
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
