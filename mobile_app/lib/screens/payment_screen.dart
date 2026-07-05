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

class _PaymentScreenState extends State<PaymentScreen>
    with TickerProviderStateMixin {
  final TextEditingController _amountController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _pinController = TextEditingController();
  bool _isProcessing = false;
  String userPhone =
      "25261XXXXXXX"; // Tani waa in laga soo qaado AuthProvider ama User Profile

  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    // Saadaalinta lacagta biilka
    // Waxaan hubinaynaa in lacagta ay tahay mid sax ah oo aan ka yarayn 0.01
    _amountController.text = widget.bill['amount']?.toString() ?? "0.00";
    // userPhone = ... (Halkan ku shub lambarka isticmaalaha ee diwaangashan)

    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat(reverse: true);
    _pulseAnimation = Tween<double>(begin: 0.95, end: 1.05).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _amountController.dispose();
    _phoneController.dispose();
    _pinController.dispose();
    super.dispose();
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
        amountStr,
      );
      return;
    }

    if (!RegExp(r'^\+?\d+$').hasMatch(receiverPhone.replaceFirst('+', ''))) {
      _showResultDialog(
        false,
        lang.t('paymentFailed'),
        'Phone number must contain only numbers',
        amountStr,
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
        amountStr,
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
        setState(() => _isProcessing = false);
        _showResultDialog(
          true,
          'Lacag-bixintu Waa Guulaysatay!',
          response['message'] ?? 'Lacagtaada si guul leh ayaa loo bixiyay.',
          amountStr,
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isProcessing = false);
        _showResultDialog(false, 'Lacag-bixintu Way Fashilantay', e.toString(), amountStr);
      }
    }
  }

  void _showResultDialog(bool success, String title, String message, String amount) {
    showGeneralDialog(
      context: context,
      barrierDismissible: false,
      barrierLabel: '',
      barrierColor: Colors.black54,
      transitionDuration: const Duration(milliseconds: 400),
      pageBuilder: (context, anim1, anim2) {
        return const SizedBox.shrink();
      },
      transitionBuilder: (context, anim1, anim2, child) {
        final curvedAnim = CurvedAnimation(
          parent: anim1,
          curve: Curves.elasticOut,
        );
        return Transform.scale(
          scale: curvedAnim.value,
          child: Opacity(
            opacity: anim1.value.clamp(0.0, 1.0),
            child: _PaymentResultDialog(
              success: success,
              title: title,
              message: message,
              amount: amount,
              billTitle: widget.bill['title'] ?? 'Bill',
              onDone: () {
                Navigator.of(context).pop(); // pop dialog
                if (success) {
                  Navigator.of(this.context).pop(true); // pop payment screen
                }
              },
            ),
          ),
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
      body: Stack(
        children: [
          SingleChildScrollView(
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

          // Processing Overlay
          if (_isProcessing)
            Container(
              color: Colors.black.withOpacity(0.6),
              child: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    AnimatedBuilder(
                      animation: _pulseAnimation,
                      builder: (context, child) {
                        return Transform.scale(
                          scale: _pulseAnimation.value,
                          child: child,
                        );
                      },
                      child: Container(
                        width: 100,
                        height: 100,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: const LinearGradient(
                            colors: [Color(0xFF4F46E5), Color(0xFF6366F1)],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFF4F46E5).withOpacity(0.4),
                              blurRadius: 30,
                              spreadRadius: 5,
                            ),
                          ],
                        ),
                        child: const Center(
                          child: SizedBox(
                            width: 40,
                            height: 40,
                            child: CircularProgressIndicator(
                              color: Colors.white,
                              strokeWidth: 3,
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                    const Text(
                      'Lacagta waa la dirayaa...',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                        letterSpacing: 0.3,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Fadlan sug...',
                      style: TextStyle(
                        color: Colors.white.withOpacity(0.7),
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}

// Separate StatefulWidget for the animated result dialog
class _PaymentResultDialog extends StatefulWidget {
  final bool success;
  final String title;
  final String message;
  final String amount;
  final String billTitle;
  final VoidCallback onDone;

  const _PaymentResultDialog({
    required this.success,
    required this.title,
    required this.message,
    required this.amount,
    required this.billTitle,
    required this.onDone,
  });

  @override
  State<_PaymentResultDialog> createState() => _PaymentResultDialogState();
}

class _PaymentResultDialogState extends State<_PaymentResultDialog>
    with TickerProviderStateMixin {
  late AnimationController _iconController;
  late Animation<double> _iconScale;
  late AnimationController _glowController;
  late Animation<double> _glowAnimation;

  @override
  void initState() {
    super.initState();
    _iconController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );
    _iconScale = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _iconController, curve: Curves.elasticOut),
    );

    _glowController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat(reverse: true);
    _glowAnimation = Tween<double>(begin: 0.3, end: 0.7).animate(
      CurvedAnimation(parent: _glowController, curve: Curves.easeInOut),
    );

    // Start icon animation after dialog appears
    Future.delayed(const Duration(milliseconds: 200), () {
      if (mounted) _iconController.forward();
    });
  }

  @override
  void dispose() {
    _iconController.dispose();
    _glowController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isSuccess = widget.success;
    final primaryColor = isSuccess ? const Color(0xFF10B981) : const Color(0xFFEF4444);
    final gradientColors = isSuccess
        ? [const Color(0xFF10B981), const Color(0xFF059669)]
        : [const Color(0xFFEF4444), const Color(0xFFDC2626)];

    return Center(
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 32),
        padding: const EdgeInsets.all(28),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(28),
          boxShadow: [
            BoxShadow(
              color: primaryColor.withOpacity(0.2),
              blurRadius: 40,
              spreadRadius: 5,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        child: Material(
          color: Colors.transparent,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Animated Icon with Glow
              AnimatedBuilder(
                animation: Listenable.merge([_iconScale, _glowAnimation]),
                builder: (context, child) {
                  return Transform.scale(
                    scale: _iconScale.value,
                    child: Container(
                      width: 88,
                      height: 88,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: LinearGradient(
                          colors: gradientColors,
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: primaryColor.withOpacity(_glowAnimation.value),
                            blurRadius: 24,
                            spreadRadius: 4,
                          ),
                        ],
                      ),
                      child: Icon(
                        isSuccess ? Icons.check_rounded : Icons.close_rounded,
                        color: Colors.white,
                        size: 48,
                      ),
                    ),
                  );
                },
              ),
              const SizedBox(height: 24),

              // Title
              Text(
                widget.title,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 21,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF111827),
                  letterSpacing: -0.3,
                ),
              ),
              const SizedBox(height: 12),

              // Amount (for success)
              if (isSuccess) ...[
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                  decoration: BoxDecoration(
                    color: const Color(0xFF10B981).withOpacity(0.08),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    '\$${widget.amount}',
                    style: const TextStyle(
                      fontSize: 32,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF059669),
                      letterSpacing: -0.5,
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  widget.billTitle,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey.shade500,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  'Si guul leh ayaa loo bixiyay',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 13,
                    color: Colors.grey.shade400,
                  ),
                ),
              ],

              // Error message
              if (!isSuccess) ...[
                const SizedBox(height: 4),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.red.shade50,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    widget.message,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 13,
                      color: Colors.red.shade700,
                      height: 1.4,
                    ),
                  ),
                ),
              ],

              const SizedBox(height: 24),

              // Button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: widget.onDone,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.transparent,
                    foregroundColor: Colors.white,
                    elevation: 0,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ).copyWith(
                    backgroundColor: WidgetStateProperty.all(Colors.transparent),
                  ),
                  child: Ink(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(colors: gradientColors),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Container(
                      alignment: Alignment.center,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            isSuccess ? Icons.check_circle_outline : Icons.refresh,
                            size: 20,
                            color: Colors.white,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            isSuccess ? 'Dhammaystir' : 'Dib u Isku Day',
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
