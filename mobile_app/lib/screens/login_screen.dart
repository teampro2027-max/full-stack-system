import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import 'dart:async';
import 'package:flutter/services.dart';
import '../services/notification_service.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({Key? key}) : super(key: key);

  @override
  _LoginScreenState createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    try {
      final res = await Provider.of<AuthProvider>(
        context,
        listen: false,
      ).login(_emailController.text.trim().toLowerCase(), _passwordController.text);
      if (!mounted) return;

      if (res != null && res['requiresOtp'] == true) {
        if (res['debugOtp'] != null) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Debug OTP: ${res['debugOtp']} (Copy and enter below)'),
              backgroundColor: const Color(0xFF5B21B6),
              duration: const Duration(seconds: 15),
              behavior: SnackBarBehavior.floating,
              action: SnackBarAction(
                label: 'Dismiss',
                textColor: Colors.white,
                onPressed: () {},
              ),
            ),
          );
        }
        _showOtpDialog(_emailController.text.trim().toLowerCase());
      } else {
        Navigator.of(context).pushReplacementNamed('/dashboard');
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(
        content: Text(e.toString().replaceFirst('Exception: ', '')),
        backgroundColor: const Color(0xFFEF4444),
        behavior: SnackBarBehavior.floating,
      ));
    }
  }

  void _showOtpDialog(String email) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => LoginOtpDialog(email: email),
    );
  }

  void _showForgotPasswordDialog() {
    final emailResetController = TextEditingController();
    final otpResetController = TextEditingController();
    final newPasswordController = TextEditingController();
    final confirmPasswordController = TextEditingController();

    bool hasSentOtp = false;
    String sentToEmail = '';

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) {
        bool processing = false;
        bool obscureNewPass = true;
        bool obscureConfirmPass = true;

        return StatefulBuilder(
          builder: (dialogContext, setDialogState) {
            return AlertDialog(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
              ),
              title: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: const Color(0xFF5B21B6).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(
                      hasSentOtp ? Icons.lock_reset : Icons.email_outlined,
                      color: const Color(0xFF5B21B6),
                      size: 22,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Text(
                    hasSentOtp ? 'Reset Password' : 'Forgot Password',
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (!hasSentOtp) ...[
                      const Text(
                        'Fadlan geli Gmail-kaaga si aan kuugu soo dirno koodka xaqiijinta ee OTP.',
                        style: TextStyle(fontSize: 13, color: Color(0xFF6B7280)),
                      ),
                      const SizedBox(height: 16),
                      TextField(
                        controller: emailResetController,
                        keyboardType: TextInputType.emailAddress,
                        decoration: InputDecoration(
                          hintText: 'yourname@gmail.com',
                          prefixIcon: const Icon(Icons.email_outlined),
                          filled: true,
                          fillColor: const Color(0xFFF9FAFB),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),
                    ] else ...[
                      RichText(
                        text: TextSpan(
                          style: const TextStyle(fontSize: 13, color: Color(0xFF6B7280)),
                          children: [
                            const TextSpan(text: 'Koodhka OTP ayaa loo diray '),
                            TextSpan(
                              text: sentToEmail,
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF5B21B6),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                      const Text(
                        'OTP Code',
                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 6),
                      TextField(
                        controller: otpResetController,
                        keyboardType: TextInputType.number,
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 4,
                        ),
                        decoration: InputDecoration(
                          hintText: 'Enter 6-digit OTP',
                          filled: true,
                          fillColor: const Color(0xFFF9FAFB),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      const Text(
                        'New Password',
                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 6),
                      TextField(
                        controller: newPasswordController,
                        obscureText: obscureNewPass,
                        decoration: InputDecoration(
                          hintText: 'Enter new password',
                          prefixIcon: const Icon(Icons.lock_outline),
                          suffixIcon: IconButton(
                            icon: Icon(
                              obscureNewPass ? Icons.visibility_off : Icons.visibility,
                            ),
                            onPressed: () {
                              setDialogState(() {
                                obscureNewPass = !obscureNewPass;
                              });
                            },
                          ),
                          filled: true,
                          fillColor: const Color(0xFFF9FAFB),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      const Text(
                        'Confirm Password',
                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 6),
                      TextField(
                        controller: confirmPasswordController,
                        obscureText: obscureConfirmPass,
                        decoration: InputDecoration(
                          hintText: 'Confirm new password',
                          prefixIcon: const Icon(Icons.lock_outline),
                          suffixIcon: IconButton(
                            icon: Icon(
                              obscureConfirmPass ? Icons.visibility_off : Icons.visibility,
                            ),
                            onPressed: () {
                              setDialogState(() {
                                obscureConfirmPass = !obscureConfirmPass;
                              });
                            },
                          ),
                          filled: true,
                          fillColor: const Color(0xFFF9FAFB),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: processing ? null : () => Navigator.of(ctx).pop(),
                  child: const Text('Cancel', style: TextStyle(color: Color(0xFF9CA3AF))),
                ),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF5B21B6),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  onPressed: processing
                      ? null
                      : () async {
                          if (!hasSentOtp) {
                            final email = emailResetController.text.trim().toLowerCase();
                            if (email.isEmpty || !email.endsWith('@gmail.com')) {
                              ScaffoldMessenger.of(dialogContext).showSnackBar(
                                const SnackBar(
                                  content: Text('Fadlan geli Gmail sax ah (@gmail.com)'),
                                  backgroundColor: Colors.red,
                                ),
                              );
                              return;
                            }
                            setDialogState(() => processing = true);
                            try {
                              final res = await Provider.of<AuthProvider>(
                                dialogContext,
                                listen: false,
                              ).forgotPassword(email);
                              
                              setDialogState(() {
                                hasSentOtp = true;
                                sentToEmail = email;
                                processing = false;
                              });

                              if (res['debugOtp'] != null) {
                                ScaffoldMessenger.of(dialogContext).showSnackBar(
                                  SnackBar(
                                    content: Text('Debug Reset OTP: ${res['debugOtp']} (Copy and enter below)'),
                                    backgroundColor: const Color(0xFF5B21B6),
                                    duration: const Duration(seconds: 15),
                                  ),
                                );
                              }
                            } catch (e) {
                              setDialogState(() => processing = false);
                              ScaffoldMessenger.of(dialogContext).showSnackBar(
                                SnackBar(
                                  content: Text(e.toString().replaceFirst('Exception: ', '')),
                                  backgroundColor: Colors.red,
                                ),
                              );
                            }
                          } else {
                            final otp = otpResetController.text.trim();
                            final newPass = newPasswordController.text;
                            final confirmPass = confirmPasswordController.text;

                            if (otp.length != 6) {
                              ScaffoldMessenger.of(dialogContext).showSnackBar(
                                const SnackBar(
                                  content: Text('Fadlan geli 6-digit OTP code'),
                                  backgroundColor: Colors.red,
                                ),
                              );
                              return;
                            }
                            if (newPass.length < 6) {
                              ScaffoldMessenger.of(dialogContext).showSnackBar(
                                const SnackBar(
                                  content: Text('Password-ku waa inuu ka koobnaadaa ugu yaraan 6 xaraf'),
                                  backgroundColor: Colors.red,
                                ),
                              );
                              return;
                            }
                            if (newPass != confirmPass) {
                              ScaffoldMessenger.of(dialogContext).showSnackBar(
                                const SnackBar(
                                  content: Text('Password-ka cusub iyo kan xaqiijinta isma laha'),
                                  backgroundColor: Colors.red,
                                ),
                              );
                              return;
                            }

                            setDialogState(() => processing = true);
                            try {
                              await Provider.of<AuthProvider>(
                                dialogContext,
                                listen: false,
                              ).resetPassword(sentToEmail, otp, newPass);

                              Navigator.of(ctx).pop();
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('Password-kaaga dib ayaa loo dejiyay si guul leh. Hadda soo gal.'),
                                  backgroundColor: Colors.green,
                                ),
                              );
                            } catch (e) {
                              setDialogState(() => processing = false);
                              ScaffoldMessenger.of(dialogContext).showSnackBar(
                                SnackBar(
                                  content: Text(e.toString().replaceFirst('Exception: ', '')),
                                  backgroundColor: Colors.red,
                                ),
                              );
                            }
                          }
                        },
                  child: processing
                      ? const SizedBox(
                          height: 18,
                          width: 18,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : Text(hasSentOtp ? 'Reset Password' : 'Send OTP'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final isLoading = Provider.of<AuthProvider>(context).isLoading;

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFFEEF2FF), Color(0xFFFFFFFF)],
          ),
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
            child: Column(
              children: [
                const SizedBox(height: 28),
                Center(
                  child: Container(
                    width: 88,
                    height: 88,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(24),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.08),
                          blurRadius: 22,
                          offset: const Offset(0, 12),
                        ),
                      ],
                    ),
                    child: const Icon(
                      Icons.account_balance_wallet,
                      size: 44,
                      color: Color(0xFF5B21B6),
                    ),
                  ),
                ),
                const SizedBox(height: 30),
                Container(
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(30),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.08),
                        blurRadius: 30,
                        offset: const Offset(0, 16),
                      ),
                    ],
                  ),
                  padding: const EdgeInsets.fromLTRB(24, 32, 24, 24),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        const Text(
                          'Login to Your Account',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 28,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF111827),
                          ),
                        ),
                        const SizedBox(height: 10),
                        const Text(
                          'Securely access your bills and payment history.',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 15,
                            color: Color(0xFF6B7280),
                          ),
                        ),
                        const SizedBox(height: 32),
                        TextFormField(
                          controller: _emailController,
                          decoration: InputDecoration(
                            filled: true,
                            fillColor: const Color(0xFFF8FAFF),
                            labelText: 'Email Address',
                            prefixIcon: const Icon(
                              Icons.email_outlined,
                              color: Color(0xFF5B21B6),
                            ),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(18),
                              borderSide: BorderSide.none,
                            ),
                            contentPadding: const EdgeInsets.symmetric(
                              horizontal: 20,
                              vertical: 18,
                            ),
                          ),
                          keyboardType: TextInputType.emailAddress,
                          validator: (value) =>
                              value!.isEmpty ? 'Please enter your email' : null,
                        ),
                        const SizedBox(height: 18),
                        TextFormField(
                          controller: _passwordController,
                          decoration: InputDecoration(
                            filled: true,
                            fillColor: const Color(0xFFF8FAFF),
                            labelText: 'Password',
                            prefixIcon: const Icon(
                              Icons.lock_outline,
                              color: Color(0xFF5B21B6),
                            ),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(18),
                              borderSide: BorderSide.none,
                            ),
                            contentPadding: const EdgeInsets.symmetric(
                              horizontal: 20,
                              vertical: 18,
                            ),
                          ),
                          obscureText: true,
                          validator: (value) => value!.isEmpty
                              ? 'Please enter your password'
                              : null,
                        ),
                        const SizedBox(height: 12),
                        Align(
                          alignment: Alignment.centerRight,
                          child: TextButton(
                            onPressed: _showForgotPasswordDialog,
                            style: TextButton.styleFrom(
                              foregroundColor: const Color(0xFF5B21B6),
                              textStyle: const TextStyle(
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            child: const Text('Forgot Password?'),
                          ),
                        ),
                        const SizedBox(height: 8),
                        ElevatedButton(
                          onPressed: isLoading ? null : _submit,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF5B21B6),
                            padding: const EdgeInsets.symmetric(vertical: 18),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(18),
                            ),
                          ),
                          child: isLoading
                              ? const SizedBox(
                                  height: 20,
                                  width: 20,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: Colors.white,
                                  ),
                                )
                              : const Text(
                                  'Sign In',
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w600,
                                    color: Colors.white,
                                  ),
                                ),
                        ),
                        const SizedBox(height: 20),
                        Row(
                          children: const [
                            Expanded(child: Divider(color: Color(0xFFE5E7EB))),
                            Padding(
                              padding: EdgeInsets.symmetric(horizontal: 12.0),
                              child: Text(
                                'or',
                                style: TextStyle(color: Color(0xFF9CA3AF)),
                              ),
                            ),
                            Expanded(child: Divider(color: Color(0xFFE5E7EB))),
                          ],
                        ),
                        const SizedBox(height: 20),
                        TextButton(
                          onPressed: () =>
                              Navigator.of(context).pushNamed('/register'),
                          style: TextButton.styleFrom(
                            foregroundColor: const Color(0xFF5B21B6),
                            textStyle: const TextStyle(
                              fontWeight: FontWeight.w600,
                              fontSize: 15,
                            ),
                          ),
                          child: const Text('Don\'t have an account? Sign Up'),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 14),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class LoginOtpDialog extends StatefulWidget {
  final String email;
  const LoginOtpDialog({super.key, required this.email});

  @override
  State<LoginOtpDialog> createState() => _LoginOtpDialogState();
}

class _LoginOtpDialogState extends State<LoginOtpDialog> {
  final _otpController = TextEditingController();
  bool _verifying = false;
  int _timeLeft = 120;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _startTimer();
  }

  void _startTimer() {
    _timeLeft = 120;
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }
      if (_timeLeft > 0) {
        setState(() => _timeLeft--);
      } else {
        timer.cancel();
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _otpController.dispose();
    super.dispose();
  }

  Future<void> _resendOtp() async {
    try {
      setState(() => _verifying = true);
      String? fcmToken = await NotificationService.getToken();
      if (!mounted) return;
      await Provider.of<AuthProvider>(context, listen: false).resendLoginOtp(widget.email, fcmToken: fcmToken);
      _startTimer();
      setState(() => _verifying = false);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('A new OTP has been sent!'),
          backgroundColor: Colors.green,
          behavior: SnackBarBehavior.floating,
        ),
      );
    } catch (e) {
      setState(() => _verifying = false);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString().replaceFirst('Exception: ', '')),
          backgroundColor: const Color(0xFFEF4444),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  Future<void> _verifyOtp() async {
    if (_otpController.text.trim().length != 6) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please enter the 6-digit OTP code'),
          backgroundColor: Color(0xFFEF4444),
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }
    setState(() => _verifying = true);
    final dialogNav = Navigator.of(context);
    final rootNav = Navigator.of(context, rootNavigator: true);
    try {
      await Provider.of<AuthProvider>(context, listen: false).verifyLoginOtp(widget.email, _otpController.text.trim());
      dialogNav.pop();
      rootNav.pushReplacementNamed('/dashboard');
    } catch (e) {
      setState(() => _verifying = false);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString().replaceFirst('Exception: ', '')),
          backgroundColor: const Color(0xFFEF4444),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    int minutes = _timeLeft ~/ 60;
    int seconds = _timeLeft % 60;
    String timerText = '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';

    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      title: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: const Color(0xFF5B21B6).withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(Icons.mark_email_read_outlined, color: Color(0xFF5B21B6), size: 22),
          ),
          const SizedBox(width: 10),
          const Text('Verify Login', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        ],
      ),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          RichText(
            textAlign: TextAlign.center,
            text: TextSpan(
              style: const TextStyle(fontSize: 13, color: Color(0xFF6B7280)),
              children: [
                const TextSpan(text: 'A 6-digit verification code was sent to\n'),
                TextSpan(text: widget.email, style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF5B21B6))),
              ],
            ),
          ),
          const SizedBox(height: 20),
          TextField(
            controller: _otpController,
            keyboardType: TextInputType.number,
            inputFormatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(6)],
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold, letterSpacing: 10, color: Color(0xFF111827)),
            decoration: InputDecoration(
              hintText: '------',
              hintStyle: const TextStyle(letterSpacing: 10, color: Color(0xFFD1D5DB)),
              filled: true,
              fillColor: const Color(0xFFF9FAFB),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE5E7EB))),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE5E7EB))),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF5B21B6), width: 2)),
            ),
          ),
          const SizedBox(height: 15),
          if (_timeLeft > 0)
            Text('Code expires in: $timerText', style: const TextStyle(color: Color(0xFFEF4444), fontWeight: FontWeight.bold))
          else
            TextButton(
              onPressed: _verifying ? null : _resendOtp,
              child: const Text('Try Again / Resend OTP', style: TextStyle(color: Color(0xFF5B21B6), fontWeight: FontWeight.bold)),
            ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: _verifying ? null : () => Navigator.of(context).pop(),
          child: const Text('Cancel', style: TextStyle(color: Color(0xFF9CA3AF))),
        ),
        ElevatedButton(
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF5B21B6),
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 10),
          ),
          onPressed: _verifying ? null : _verifyOtp,
          child: _verifying ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) : const Text('Verify'),
        ),
      ],
    );
  }
}
