import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen>
    with SingleTickerProviderStateMixin {
  final _nameController = TextEditingController();
  // User types only the part BEFORE @gmail.com
  final _gmailPrefixController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool _obscurePassword = true;
  late AnimationController _animController;
  late Animation<double> _fadeAnim;

  // Derived full gmail address
  String get _fullEmail =>
      '${_gmailPrefixController.text.trim().toLowerCase()}@gmail.com';

  // Initials from name (first 2 letters)
  String get _initials {
    final trimmed = _nameController.text.trim();
    if (trimmed.isEmpty) return '?';
    final words = trimmed.split(RegExp(r'\s+'));
    if (words.length >= 2) {
      return '${words[0][0]}${words[1][0]}'.toUpperCase();
    }
    return trimmed.length >= 2
        ? trimmed.substring(0, 2).toUpperCase()
        : trimmed[0].toUpperCase();
  }

  String _normalizePhone(String value) => value.replaceAll(RegExp(r'\D'), '');

  bool get _isNameValid {
    final value = _nameController.text.trim();
    if (value.isEmpty) return false;
    if (!RegExp(r'^[a-zA-Z\s]+$').hasMatch(value)) return false;
    if (value.length < 2) return false;
    return true;
  }

  bool get _isGmailValid {
    final prefix = _gmailPrefixController.text.trim();
    if (prefix.isEmpty || prefix.length < 3) return false;
    if (!RegExp(r'^[a-zA-Z]').hasMatch(prefix)) return false;
    final fullEmail = '${prefix.toLowerCase()}@gmail.com';
    if (!RegExp(r'^[a-zA-Z0-9._%+\-]+@gmail\.com$').hasMatch(fullEmail)) return false;
    return true;
  }

  bool get _isPhoneValid {
    final normalized = _normalizePhone(_phoneController.text);
    if (normalized.isEmpty) return false;
    if (normalized.length < 7 || normalized.length > 10) return false;
    return true;
  }

  bool get _isPasswordValid {
    final value = _passwordController.text;
    if (value.length < 6) return false;
    if (!RegExp(r'[a-zA-Z]').hasMatch(value)) return false;
    if (!RegExp(r'\d').hasMatch(value)) return false;
    if (!RegExp(r'[!@#\$%\^&\*\(\)_\+\-\=\[\]\{\};:\x27\x22,<>\.\?\/\\|`~]').hasMatch(value)) return false;
    return true;
  }

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 700),
    );
    _fadeAnim = CurvedAnimation(parent: _animController, curve: Curves.easeOut);
    _animController.forward();

    // Rebuild to update initials avatar when name changes
    _nameController.addListener(() => setState(() {}));
    // Rebuild to update live email preview helper text
    _gmailPrefixController.addListener(() => setState(() {}));
    _phoneController.addListener(() => setState(() {}));
    _passwordController.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _nameController.dispose();
    _gmailPrefixController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    _animController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final email = _fullEmail;

      // Log for debugging: Hubi in email-ka uu sax yahay ka hor intaan la dirin
      debugPrint('Attempting registration for: $email');

      final res = await authProvider.register(
        _nameController.text.trim(),
        email,
        _passwordController.text,
        '252${_normalizePhone(_phoneController.text)}',
      );

      if (!mounted) return;

      // Haddii backend-ku uu email-ka diray, wuxuu soo celinayaa requiresOtp: true
      // Haddii kale, check-ga backend-ka logs-kiisa fiiri
      if (res != null && res['requiresOtp'] == true) {
        if (res['debugOtp'] != null) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Debug OTP: ${res['debugOtp']} (Copy and enter below)'),
              backgroundColor: const Color(0xFF4F46E5),
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
        _showOtpDialog(email);
      } else {
        Navigator.of(context).pushReplacementNamed('/dashboard');
      }
    } catch (e) {
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

  void _showOtpDialog(String email) {
    final otpController = TextEditingController();
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) {
        bool verifying = false;
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
                      color: const Color(0xFF4F46E5).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(
                      Icons.mark_email_read_outlined,
                      color: Color(0xFF4F46E5),
                      size: 22,
                    ),
                  ),
                  const SizedBox(width: 10),
                  const Text(
                    'Verify Email',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  RichText(
                    text: TextSpan(
                      style: const TextStyle(
                        fontSize: 13,
                        color: Color(0xFF6B7280),
                      ),
                      children: [
                        const TextSpan(
                          text: 'A 6-digit verification code was sent to ',
                        ),
                        TextSpan(
                          text: email,
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF4F46E5),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),
                  TextField(
                    controller: otpController,
                    keyboardType: TextInputType.number,
                    inputFormatters: [
                      FilteringTextInputFormatter.digitsOnly,
                      LengthLimitingTextInputFormatter(6),
                    ],
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 10,
                      color: Color(0xFF111827),
                    ),
                    decoration: InputDecoration(
                      hintText: '------',
                      hintStyle: const TextStyle(
                        letterSpacing: 10,
                        color: Color(0xFFD1D5DB),
                      ),
                      filled: true,
                      fillColor: const Color(0xFFF9FAFB),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(
                          color: Color(0xFF4F46E5),
                          width: 2,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: verifying ? null : () => Navigator.of(ctx).pop(),
                  child: const Text(
                    'Cancel',
                    style: TextStyle(color: Color(0xFF9CA3AF)),
                  ),
                ),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF4F46E5),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 24,
                      vertical: 10,
                    ),
                  ),
                  onPressed: verifying
                      ? null
                      : () async {
                          if (otpController.text.trim().length != 6) {
                            ScaffoldMessenger.of(dialogContext).showSnackBar(
                              const SnackBar(
                                content: Text(
                                  'Please enter the 6-digit OTP code',
                                ),
                                backgroundColor: Color(0xFFEF4444),
                                behavior: SnackBarBehavior.floating,
                              ),
                            );
                            return;
                          }
                          setDialogState(() => verifying = true);
                          // Capture navigators before any await (avoids BuildContext async gap lint)
                          final dialogNav = Navigator.of(ctx);
                          final rootNav = Navigator.of(context);
                          try {
                            await Provider.of<AuthProvider>(
                              dialogContext,
                              listen: false,
                            ).verifyRegisterOtp(
                              email,
                              otpController.text.trim(),
                            );
                            dialogNav.pop();
                            rootNav.pushReplacementNamed('/dashboard');
                          } catch (e) {
                            setDialogState(() => verifying = false);
                            ScaffoldMessenger.of(dialogContext).showSnackBar(
                              SnackBar(
                                content: Text(
                                  e.toString().replaceFirst('Exception: ', ''),
                                ),
                                backgroundColor: const Color(0xFFEF4444),
                                behavior: SnackBarBehavior.floating,
                              ),
                            );
                          }
                        },
                  child: verifying
                      ? const SizedBox(
                          height: 18,
                          width: 18,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Text(
                          'Verify & Continue',
                          style: TextStyle(fontWeight: FontWeight.w600),
                        ),
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
            colors: [Color(0xFF4F46E5), Color(0xFF7C3AED)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              // Top bar
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 8,
                ),
                child: Row(
                  children: [
                    IconButton(
                      onPressed: () => Navigator.of(context).pop(),
                      icon: const Icon(
                        Icons.arrow_back_ios,
                        color: Colors.white,
                        size: 20,
                      ),
                    ),
                    const SizedBox(width: 4),
                    const Text(
                      'Create Account',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
              // Avatar with initials
              FadeTransition(
                opacity: _fadeAnim,
                child: Column(
                  children: [
                    const SizedBox(height: 8),
                    Stack(
                      alignment: Alignment.bottomRight,
                      children: [
                        Container(
                          width: 90,
                          height: 90,
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.25),
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: Colors.white.withOpacity(0.6),
                              width: 3,
                            ),
                          ),
                          child: Center(
                            child: Text(
                              _initials,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 32,
                                fontWeight: FontWeight.bold,
                                letterSpacing: 2,
                              ),
                            ),
                          ),
                        ),
                        Container(
                          width: 26,
                          height: 26,
                          decoration: const BoxDecoration(
                            color: Colors.white,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.person_add,
                            size: 16,
                            color: Color(0xFF4F46E5),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              // Form card
              Expanded(
                child: Container(
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.vertical(
                      top: Radius.circular(32),
                    ),
                  ),
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.fromLTRB(24, 28, 24, 24),
                    child: Form(
                      key: _formKey,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          // Full Name
                          _buildLabel('Full Name'),
                          const SizedBox(height: 6),
                          TextFormField(
                            controller: _nameController,
                            textCapitalization: TextCapitalization.words,
                            inputFormatters: [
                              FilteringTextInputFormatter.allow(
                                RegExp(r'[a-zA-Z\s]'),
                              ),
                            ],
                            decoration: _dynamicDecoration(
                              hint: 'e.g. Ahmed Ali',
                              icon: Icons.person_outline,
                              isValid: _isNameValid,
                              isEmpty: _nameController.text.isEmpty,
                            ),
                            validator: (value) {
                              if (value == null || value.trim().isEmpty) return 'Please enter your full name';
                              if (!RegExp(r'^[a-zA-Z\s]+$').hasMatch(value.trim())) return 'Name can only contain letters';
                              if (value.trim().length < 2) return 'Name must be at least 2 characters';
                              return null;
                            },
                          ),
                          const SizedBox(height: 16),

                          // Gmail address (locked @gmail.com)
                          _buildLabel('Gmail Address'),
                          const SizedBox(height: 6),
                          TextFormField(
                            controller: _gmailPrefixController,
                            keyboardType: TextInputType.emailAddress,
                            inputFormatters: [
                              // Allow only valid email-prefix chars, block spaces
                              FilteringTextInputFormatter.allow(
                                RegExp(r'[a-zA-Z0-9._+\-]'),
                              ),
                            ],
                            decoration: _dynamicDecoration(
                              hint: 'yourname',
                              icon: Icons.email_outlined,
                              isValid: _isGmailValid,
                              isEmpty: _gmailPrefixController.text.isEmpty,
                            ).copyWith(
                              suffix: const Text(
                                '@gmail.com',
                                style: TextStyle(
                                  color: Color(0xFF4F46E5),
                                  fontWeight: FontWeight.bold,
                                  fontSize: 14,
                                ),
                              ),
                            ),
                            validator: (value) {
                              final prefix = value?.trim() ?? '';
                              if (prefix.isEmpty) return 'Please enter your Gmail username';
                              if (!RegExp(r'^[a-zA-Z]').hasMatch(prefix)) return 'Must start with a letter';
                              if (prefix.length < 3) return 'Gmail username must be at least 3 characters';
                              final fullEmail = '${prefix.toLowerCase()}@gmail.com';
                              if (!RegExp(r'^[a-zA-Z0-9._%+\-]+@gmail\.com$').hasMatch(fullEmail)) return 'Enter a valid Gmail username';
                              return null;
                            },
                          ),
                          // Helper text showing the full email they will use
                          Padding(
                            padding: const EdgeInsets.only(top: 4, left: 4),
                            child: Text(
                              _gmailPrefixController.text.trim().isEmpty
                                  ? 'OTP will be sent to your Gmail'
                                  : 'OTP → ${_gmailPrefixController.text.trim().toLowerCase()}@gmail.com',
                              style: const TextStyle(
                                fontSize: 11,
                                color: Color(0xFF9CA3AF),
                              ),
                            ),
                          ),
                          const SizedBox(height: 16),

                          // Phone Number
                          _buildLabel('Phone Number'),
                          const SizedBox(height: 6),
                          TextFormField(
                            controller: _phoneController,
                            keyboardType: TextInputType.phone,
                            inputFormatters: [
                              FilteringTextInputFormatter.digitsOnly,
                              LengthLimitingTextInputFormatter(15),
                            ],
                            decoration: _dynamicDecoration(
                              hint: '61XXXXXXX',
                              icon: Icons.phone_outlined,
                              isValid: _isPhoneValid,
                              isEmpty: _phoneController.text.isEmpty,
                              prefix: const Text(
                                '+252 ',
                                style: TextStyle(
                                  color: Color(0xFF374151),
                                  fontWeight: FontWeight.bold,
                                  fontSize: 15,
                                ),
                              ),
                            ),
                            validator: (value) {
                              final normalized = _normalizePhone(value ?? '');
                              if (normalized.isEmpty) return 'Please enter your phone number';
                              if (normalized.length < 7 || normalized.length > 10) return 'Please enter 7-10 digits';
                              return null;
                            },
                          ),
                          const SizedBox(height: 16),

                          // Password
                          _buildLabel('Password'),
                          const SizedBox(height: 6),
                          TextFormField(
                            controller: _passwordController,
                            obscureText: _obscurePassword,
                            decoration: _dynamicDecoration(
                              hint: 'Min. 6 chars (letters, numbers, symbols)',
                              icon: Icons.lock_outline,
                              isValid: _isPasswordValid,
                              isEmpty: _passwordController.text.isEmpty,
                            ).copyWith(
                              suffixIcon: IconButton(
                                icon: Icon(
                                  _obscurePassword
                                      ? Icons.visibility_off_outlined
                                      : Icons.visibility_outlined,
                                  color: const Color(0xFF9CA3AF),
                                  size: 20,
                                ),
                                onPressed: () => setState(
                                  () => _obscurePassword = !_obscurePassword,
                                ),
                              ),
                            ),
                            validator: (value) {
                              if (value == null || value.isEmpty) return 'Password is required';
                              if (value.length < 6) return 'At least 6 characters required';
                              if (!RegExp(r'[a-zA-Z]').hasMatch(value)) return 'Must contain a letter';
                              if (!RegExp(r'\d').hasMatch(value)) return 'Must contain a number';
                              if (!RegExp(r'[!@#\$%\^&\*\(\)_\+\-\=\[\]\{\};:\x27\x22,<>\.\?\/\\|`~]').hasMatch(value)) return 'Must contain a symbol';
                              return null;
                            },
                          ),
                          const SizedBox(height: 32),

                          // Register button
                          SizedBox(
                            height: 52,
                            child: ElevatedButton(
                              onPressed: isLoading ? null : _submit,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF4F46E5),
                                foregroundColor: Colors.white,
                                elevation: 0,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(14),
                                ),
                              ),
                              child: isLoading
                                  ? const SizedBox(
                                      height: 22,
                                      width: 22,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2.5,
                                        color: Colors.white,
                                      ),
                                    )
                                  : const Text(
                                      'Create Account & Send OTP',
                                      style: TextStyle(
                                        fontSize: 15,
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                            ),
                          ),
                          const SizedBox(height: 16),
                          Center(
                            child: TextButton(
                              onPressed: () => Navigator.of(context).pop(),
                              child: RichText(
                                text: const TextSpan(
                                  style: TextStyle(fontSize: 13),
                                  children: [
                                    TextSpan(
                                      text: 'Already have an account? ',
                                      style: TextStyle(
                                        color: Color(0xFF6B7280),
                                      ),
                                    ),
                                    TextSpan(
                                      text: 'Sign In',
                                      style: TextStyle(
                                        color: Color(0xFF4F46E5),
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 8),
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

  Widget _buildLabel(String text) {
    return Text(
      text,
      style: const TextStyle(
        fontSize: 13,
        fontWeight: FontWeight.w600,
        color: Color(0xFF374151),
      ),
    );
  }

  InputDecoration _dynamicDecoration({
    required String hint,
    required IconData icon,
    required bool isValid,
    required bool isEmpty,
    Widget? prefixIcon,
    Widget? prefix,
  }) {
    Color borderColor = isEmpty ? const Color(0xFFE5E7EB) : (isValid ? Colors.green : Colors.red);
    Color focusColor = isEmpty ? const Color(0xFF4F46E5) : (isValid ? Colors.green : Colors.red);
    
    return InputDecoration(
      hintText: hint,
      hintStyle: const TextStyle(color: Color(0xFFD1D5DB), fontSize: 14),
      prefixIcon: prefixIcon ?? Icon(icon, color: const Color(0xFF9CA3AF), size: 20),
      prefix: prefix,
      filled: true,
      fillColor: const Color(0xFFF9FAFB),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: borderColor)),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: borderColor)),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: focusColor, width: 2)),
      errorBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Colors.red)),
      focusedErrorBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Colors.red, width: 2)),
    );
  }
}
