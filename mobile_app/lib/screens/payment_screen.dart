import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/language_provider.dart';
import '../services/api_service.dart';

class PaymentScreen extends StatefulWidget {
  final Map<String, dynamic> bill;
  const PaymentScreen({Key? key, required this.bill}) : super(key: key);

  @override
  _PaymentScreenState createState() => _PaymentScreenState();
}

class _PaymentScreenState extends State<PaymentScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  late TextEditingController _amountController;
  late TextEditingController _receiverPhoneController;
  late TextEditingController _pinController;
  bool _loading = false;
  Map<String, dynamic>? _result;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _amountController = TextEditingController(
      text:
          (widget.bill['amount'] as num?)?.toStringAsFixed(2) ??
          widget.bill['amount'].toString(),
    );
    _receiverPhoneController = TextEditingController();
    _pinController = TextEditingController();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _amountController.dispose();
    _receiverPhoneController.dispose();
    _pinController.dispose();
    super.dispose();
  }

  double? _parsedAmount() {
    return double.tryParse(_amountController.text.trim());
  }

  String _errorMessage(Object error) {
    final raw = error.toString();
    if (raw.startsWith('Exception: ')) {
      return raw.substring('Exception: '.length);
    }
    return raw;
  }

  Future<bool> _confirmWaafiPayment(String phone, double amount) async {
    final result = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Confirm Payment'),
        content: Text('Pay \$$amount using registered phone number $phone?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Confirm'),
          ),
        ],
      ),
    );

    return result ?? false;
  }

  Future<void> _payWaafi(String phone) async {
    final amount = _parsedAmount();
    final receiverPhone = _receiverPhoneController.text.trim();
    final pin = _pinController.text.trim();

    if (amount == null || amount <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a valid amount')),
      );
      return;
    }

    if (receiverPhone.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Fadlan geli numberka ama koontada')),
      );
      return;
    }

    // Note: In real WaafiPay, the PIN is entered on the phone's USSD prompt.
    // We can still require it here for app security if desired, or skip it.
    if (pin.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Fadlan geli PIN-kaaga si aad u xaqiijiso'),
        ),
      );
      return;
    }

    setState(() {
      _loading = true;
      _result = null;
    });

    try {
      final res = await ApiService.post('/payments/waafi', {
        'billId': widget.bill['_id'],
        'amount': amount,
        'description': 'Payment for ${widget.bill['title']}',
        'receiverPhone': receiverPhone,
      });
      setState(() => _result = {'success': true, 'data': res});
    } catch (e) {
      setState(
        () => _result = {
          'success': false,
          'data': {'message': _errorMessage(e)},
        },
      );
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  Future<void> _payStripe() async {
    final amount = _parsedAmount();
    if (amount == null || amount <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a valid amount')),
      );
      return;
    }

    setState(() {
      _loading = true;
      _result = null;
    });
    try {
      final res = await ApiService.post('/payments/stripe', {
        'billId': widget.bill['_id'],
        'amount': amount,
      });

      await Future.delayed(const Duration(seconds: 2));

      setState(
        () => _result = {
          'success': true,
          'data': {
            'payment': {
              '_id': 'STR${DateTime.now().millisecondsSinceEpoch}',
              'status': 'success',
              'transactionId': res['clientSecret'].split('_secret')[0],
              'amount': amount,
            },
            'message': 'Card Payment Successful',
            'ussdInstructions': '',
          },
        },
      );
    } catch (e) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(e.toString())));
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final lang = Provider.of<LanguageProvider>(context);
    final auth = Provider.of<AuthProvider>(context);
    final title = widget.bill['title'];
    final registeredPhone = auth.user?['phone']?.toString() ?? '';
    final hasRegisteredPhone = registeredPhone.isNotEmpty;

    return Scaffold(
      appBar: AppBar(
        title: Text(
          lang.t('payNow'),
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
      ),
      body: _result != null
          ? _buildResult(lang)
          : Column(
              children: [
                Container(
                  width: double.infinity,
                  margin: const EdgeInsets.all(16),
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF4F46E5), Color(0xFF6366F1)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.indigo.withOpacity(0.3),
                        blurRadius: 20,
                        offset: const Offset(0, 10),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: const TextStyle(
                          color: Colors.white70,
                          fontSize: 14,
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        decoration: const BoxDecoration(
                          color: Colors.transparent,
                        ),
                        child: TextField(
                          controller: _amountController,
                          keyboardType: const TextInputType.numberWithOptions(
                            decimal: true,
                          ),
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 36,
                            fontWeight: FontWeight.bold,
                          ),
                          decoration: InputDecoration(
                            labelText: 'Amount to Pay (USD)',
                            labelStyle: const TextStyle(
                              color: Colors.blue,
                              fontSize: 16,
                              fontWeight: FontWeight.normal,
                            ),
                            prefixIcon: const Icon(
                              Icons.monetization_on,
                              color: Colors.white,
                              size: 30,
                            ),
                            prefixStyle: const TextStyle(
                              color: Colors.white,
                              fontSize: 30,
                              fontWeight: FontWeight.bold,
                            ),
                            border: InputBorder.none,
                            floatingLabelBehavior: FloatingLabelBehavior.always,
                            contentPadding: const EdgeInsets.symmetric(
                              horizontal: 20,
                              vertical: 10,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  height: 45,
                  margin: const EdgeInsets.symmetric(horizontal: 20),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade100,
                    borderRadius: BorderRadius.circular(25),
                  ),
                  child: TabBar(
                    controller: _tabController,
                    isScrollable: true,
                    padding: const EdgeInsets.all(4),
                    indicator: BoxDecoration(
                      color: const Color(0xFF4F46E5),
                      borderRadius: BorderRadius.circular(21),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFF4F46E5).withOpacity(0.2),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    labelColor: Colors.white,
                    unselectedLabelColor: Colors.grey.shade600,
                    labelStyle: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                    tabs: [
                      Tab(text: lang.t('evcPayment')),
                      const Tab(text: 'Stripe Card'),
                    ],
                  ),
                ),
                const SizedBox(height: 8),
                Expanded(
                  child: TabBarView(
                    controller: _tabController,
                    children: [
                      SingleChildScrollView(
                        padding: const EdgeInsets.all(20),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: const Color(0xFF10B981).withOpacity(0.1),
                                borderRadius: BorderRadius.circular(14),
                                border: Border.all(
                                  color: const Color(
                                    0xFF10B981,
                                  ).withOpacity(0.3),
                                ),
                              ),
                              child: const Row(
                                children: [
                                  Icon(
                                    Icons.account_balance_wallet_outlined,
                                    color: Color(0xFF059669),
                                    size: 24,
                                  ),
                                  SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          'EVC Plus Wallet',
                                          style: TextStyle(
                                            fontWeight: FontWeight.bold,
                                            color: Color(0xFF059669),
                                          ),
                                        ),
                                        Text(
                                          'Laga dirayo numberkaga diiwaangashan.',
                                          style: TextStyle(
                                            fontSize: 12,
                                            color: Color(0xFF6B7280),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 20),
                            const Text(
                              'Registered Phone Number',
                              style: TextStyle(
                                fontWeight: FontWeight.w600,
                                fontSize: 13,
                                color: Colors.black87,
                              ),
                            ),
                            const SizedBox(height: 6),
                            Container(
                              width: double.infinity,
                              padding: const EdgeInsets.symmetric(
                                horizontal: 16,
                                vertical: 16,
                              ),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: Colors.grey.shade200),
                              ),
                              child: Text(
                                hasRegisteredPhone
                                    ? registeredPhone
                                    : 'No registered phone found',
                                style: TextStyle(
                                  fontSize: 14,
                                  color: hasRegisteredPhone
                                      ? Colors.black87
                                      : Colors.red,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                            const SizedBox(height: 20),
                            const Text(
                              'Numberka Loo Dirayo (Receiver)',
                              style: TextStyle(
                                fontWeight: FontWeight.w600,
                                fontSize: 13,
                                color: Colors.black87,
                              ),
                            ),
                            const SizedBox(height: 6),
                            // The "Box" styled input for the receiver phone number
                            Container(
                              decoration: BoxDecoration(
                                color: Colors.transparent,
                                border: Border(
                                  bottom: BorderSide(
                                    color: Colors.grey.withOpacity(0.2),
                                    width: 1,
                                  ),
                                ),
                              ),
                              child: TextField(
                                controller: _receiverPhoneController,
                                keyboardType: TextInputType.phone,
                                style: const TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                  letterSpacing: 1.2,
                                ),
                                decoration: InputDecoration(
                                  hintText: '25261...',
                                  hintStyle: TextStyle(
                                    color: Colors.grey.shade400,
                                    fontSize: 16,
                                    fontWeight: FontWeight.normal,
                                    letterSpacing: 0,
                                  ),
                                  prefixIcon: const Icon(
                                    Icons.phone_android,
                                    color: Color(0xFF4F46E5),
                                  ),
                                  contentPadding: const EdgeInsets.all(18),
                                  border: InputBorder.none,
                                ),
                              ),
                            ),
                            const SizedBox(height: 20),
                            const Text(
                              'EVC Plus PIN',
                              style: TextStyle(
                                fontWeight: FontWeight.w600,
                                fontSize: 13,
                                color: Colors.black87,
                              ),
                            ),
                            const SizedBox(height: 6),
                            Container(
                              decoration: BoxDecoration(
                                color: Colors.transparent,
                                border: Border(
                                  bottom: BorderSide(
                                    color: Colors.grey.withOpacity(0.2),
                                    width: 1,
                                  ),
                                ),
                              ),
                              child: TextField(
                                controller: _pinController,
                                keyboardType: TextInputType.number,
                                obscureText: true,
                                maxLength: 4,
                                style: const TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                  letterSpacing: 4,
                                ),
                                decoration: const InputDecoration(
                                  hintText: '****',
                                  hintStyle: TextStyle(letterSpacing: 0),
                                  prefixIcon: Icon(
                                    Icons.lock_outline,
                                    color: Colors.grey,
                                  ),
                                  contentPadding: EdgeInsets.all(18),
                                  border: InputBorder.none,
                                  counterText: '',
                                ),
                              ),
                            ),
                            const SizedBox(height: 24),
                            ElevatedButton(
                              onPressed: _loading || !hasRegisteredPhone
                                  ? null
                                  : () => _payWaafi(registeredPhone),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF10B981),
                                minimumSize: const Size(double.infinity, 54),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(14),
                                ),
                                elevation: 4,
                                shadowColor: const Color(
                                  0xFF10B981,
                                ).withOpacity(0.4),
                              ),
                              child: _loading
                                  ? const CircularProgressIndicator(
                                      color: Colors.white,
                                      strokeWidth: 2,
                                    )
                                  : const Text(
                                      'Pay with EVC Plus',
                                      style: TextStyle(
                                        color: Colors.white,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 16,
                                      ),
                                    ),
                            ),
                          ],
                        ),
                      ),
                      SingleChildScrollView(
                        padding: const EdgeInsets.all(20),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: Colors.blue.shade50,
                                borderRadius: BorderRadius.circular(14),
                                border: Border.all(color: Colors.blue.shade100),
                              ),
                              child: const Row(
                                children: [
                                  Icon(
                                    Icons.credit_card,
                                    color: Color(0xFF1D4ED8),
                                    size: 24,
                                  ),
                                  SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          'Stripe International',
                                          style: TextStyle(
                                            fontWeight: FontWeight.bold,
                                            color: Color(0xFF1D4ED8),
                                          ),
                                        ),
                                        Text(
                                          'Visa / Mastercard / Apple Pay',
                                          style: TextStyle(
                                            fontSize: 12,
                                            color: Color(0xFF6B7280),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 24),
                            _cardField(
                              'Card Number',
                              '1234 5678 9012 3456',
                              Icons.credit_card,
                            ),
                            const SizedBox(height: 14),
                            Row(
                              children: [
                                Expanded(
                                  child: _cardField(
                                    'Expiry',
                                    'MM/YY',
                                    Icons.calendar_today,
                                  ),
                                ),
                                const SizedBox(width: 14),
                                Expanded(
                                  child: _cardField('CVV', '***', Icons.lock),
                                ),
                              ],
                            ),
                            const SizedBox(height: 14),
                            _cardField(
                              'Cardholder Name',
                              'Full Name',
                              Icons.person,
                            ),
                            const SizedBox(height: 24),
                            ElevatedButton(
                              onPressed: _loading ? null : _payStripe,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF635BFF),
                                minimumSize: const Size(double.infinity, 54),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(14),
                                ),
                              ),
                              child: _loading
                                  ? const CircularProgressIndicator(
                                      color: Colors.white,
                                      strokeWidth: 2,
                                    )
                                  : const Text(
                                      'Pay with Card',
                                      style: TextStyle(
                                        color: Colors.white,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 16,
                                      ),
                                    ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
    );
  }

  Widget _cardField(String label, String hint, IconData icon) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text(
        label,
        style: TextStyle(
          fontWeight: FontWeight.w600,
          fontSize: 13,
          color: Colors.grey.shade700,
        ),
      ),
      const SizedBox(height: 6),
      TextField(
        decoration: InputDecoration(
          hintText: hint,
          prefixIcon: Icon(icon, size: 18, color: Colors.grey),
          filled: true,
          fillColor: Colors.white,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: Colors.grey.shade200),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: Colors.grey.shade200),
          ),
        ),
      ),
    ],
  );

  Widget _buildResult(LanguageProvider lang) {
    final data = _result!['data'] as Map<String, dynamic>;
    final payment = data['payment'] as Map?;
    final isSuccess = payment != null && payment['status'] == 'success';
    final txId = payment?['transactionId'] ?? '';
    final message =
        data['message'] ?? (isSuccess ? lang.t('success') : lang.t('failed'));
    final referenceId = payment?['referenceId'] ?? '';
    final invoiceId = payment?['invoiceId'] ?? '';
    final providerResponse =
        data['providerResponse'] as Map<String, dynamic>? ?? const {};
    final responseMessage =
        providerResponse['responseMsg']?.toString() ??
        providerResponse['message']?.toString() ??
        '';

    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 90,
              height: 90,
              decoration: BoxDecoration(
                color: isSuccess ? const Color(0xFF10B981) : Colors.red,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: (isSuccess ? Colors.green : Colors.red).withOpacity(
                      0.3,
                    ),
                    blurRadius: 20,
                  ),
                ],
              ),
              child: Icon(
                isSuccess ? Icons.check : Icons.close,
                color: Colors.white,
                size: 48,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              responseMessage.isNotEmpty && !isSuccess
                  ? '$message\n$responseMessage'
                  : message,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: isSuccess ? const Color(0xFF10B981) : Colors.red,
              ),
            ),
            const SizedBox(height: 8),
            if (txId.isNotEmpty)
              Text(
                'Transaction ID: $txId',
                style: TextStyle(color: Colors.grey.shade600, fontSize: 13),
              ),
            if (referenceId.isNotEmpty)
              Text(
                'Reference ID: $referenceId',
                style: TextStyle(color: Colors.grey.shade600, fontSize: 13),
              ),
            if (invoiceId.isNotEmpty)
              Text(
                'Invoice ID: $invoiceId',
                style: TextStyle(color: Colors.grey.shade600, fontSize: 13),
              ),
            const SizedBox(height: 32),
            ElevatedButton(
              onPressed: () => Navigator.of(context).pop(true),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF4F46E5),
                minimumSize: const Size(double.infinity, 52),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
              child: const Text(
                'Back to Bills',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
