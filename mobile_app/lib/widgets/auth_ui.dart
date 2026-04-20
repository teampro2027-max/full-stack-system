import 'dart:math' as math;

import 'package:flutter/material.dart';

const authPrimaryBlue = Color(0xFF4F46E5);
const authPrimaryBlueDark = Color(0xFF4338CA);
const authSurfaceBlue = Color(0xFFEEF2FF);
const authBackground = Color(0xFFF9FAFB);
const authTextDark = Color(0xFF111827);
const authTextMuted = Color(0xFF6B7280);
const authFieldBorder = Color(0xFFE5E7EB);

class AuthScaffold extends StatelessWidget {
  const AuthScaffold({
    super.key,
    required this.child,
    this.showBackButton = false,
    this.onBack,
    this.maxWidth = 430,
  });

  final Widget child;
  final bool showBackButton;
  final VoidCallback? onBack;
  final double maxWidth;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: authBackground,
      body: Stack(
        children: [
          const Positioned.fill(child: _AuthBackground()),
          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
                child: ConstrainedBox(
                  constraints: BoxConstraints(maxWidth: maxWidth),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      if (showBackButton)
                        Align(
                          alignment: Alignment.centerLeft,
                          child: _BackChip(onPressed: onBack),
                        ),
                      if (showBackButton) const SizedBox(height: 16),
                      TweenAnimationBuilder<double>(
                        duration: const Duration(milliseconds: 450),
                        curve: Curves.easeOutCubic,
                        tween: Tween(begin: 0, end: 1),
                        builder: (context, value, animatedChild) {
                          return Opacity(
                            opacity: value,
                            child: Transform.translate(
                              offset: Offset(0, 28 * (1 - value)),
                              child: animatedChild,
                            ),
                          );
                        },
                        child: child,
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class AuthCard extends StatelessWidget {
  const AuthCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.fromLTRB(24, 28, 24, 24),
  });

  final Widget child;
  final EdgeInsetsGeometry padding;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: const [
          BoxShadow(
            color: Color(0x14000000),
            blurRadius: 20,
            offset: Offset(0, 10),
          ),
        ],
      ),
      padding: padding,
      child: child,
    );
  }
}

class AuthHeader extends StatelessWidget {
  const AuthHeader({
    super.key,
    required this.title,
    required this.subtitle,
    this.center = true,
  });

  final String title;
  final String subtitle;
  final bool center;

  @override
  Widget build(BuildContext context) {
    final alignment = center ? TextAlign.center : TextAlign.left;

    return Column(
      crossAxisAlignment:
          center ? CrossAxisAlignment.center : CrossAxisAlignment.start,
      children: [
        Text(
          title,
          textAlign: alignment,
          style: const TextStyle(
            color: authTextDark,
            fontSize: 30,
            fontWeight: FontWeight.w700,
            letterSpacing: -0.7,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          subtitle,
          textAlign: alignment,
          style: const TextStyle(
            color: authTextMuted,
            fontSize: 14,
            height: 1.45,
          ),
        ),
      ],
    );
  }
}

class AuthFieldLabel extends StatelessWidget {
  const AuthFieldLabel(this.text, {super.key});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: const TextStyle(
        color: authTextDark,
        fontSize: 13,
        fontWeight: FontWeight.w600,
      ),
    );
  }
}

InputDecoration authInputDecoration({
  required String hintText,
  Widget? suffixIcon,
}) {
  return InputDecoration(
    hintText: hintText,
    hintStyle: const TextStyle(
      color: Color(0xFF9BA7BC),
      fontSize: 14,
    ),
    filled: true,
    fillColor: Colors.white,
    contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
    suffixIcon: suffixIcon,
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: const BorderSide(color: authFieldBorder),
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: const BorderSide(color: authPrimaryBlue, width: 2),
    ),
    errorBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: const BorderSide(color: Color(0xFFD24C4C)),
    ),
    focusedErrorBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: const BorderSide(color: Color(0xFFD24C4C), width: 2),
    ),
  );
}

ButtonStyle authPrimaryButtonStyle() {
  return ElevatedButton.styleFrom(
    backgroundColor: authPrimaryBlue,
    foregroundColor: Colors.white,
    minimumSize: const Size.fromHeight(54),
    elevation: 0,
    padding: const EdgeInsets.symmetric(vertical: 16),
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(14),
    ),
    textStyle: const TextStyle(
      fontSize: 15,
      fontWeight: FontWeight.w700,
    ),
  );
}

ButtonStyle authOutlineButtonStyle() {
  return OutlinedButton.styleFrom(
    foregroundColor: authTextDark,
    minimumSize: const Size.fromHeight(54),
    side: const BorderSide(color: authFieldBorder),
    padding: const EdgeInsets.symmetric(vertical: 16),
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(14),
    ),
    textStyle: const TextStyle(
      fontSize: 15,
      fontWeight: FontWeight.w700,
    ),
  );
}

class WelcomeIllustration extends StatelessWidget {
  const WelcomeIllustration({super.key});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 230,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Positioned(
            top: 14,
            right: 16,
            child: Transform.rotate(
              angle: -math.pi / 18,
              child: const _PhoneFrame(
                width: 122,
                height: 185,
                child: _WelcomePhoneScreen(),
              ),
            ),
          ),
          const Positioned(
            left: 18,
            bottom: 16,
            child: _PlantCluster(),
          ),
          const Positioned(
            left: 60,
            bottom: 12,
            child: _StandingFigure(),
          ),
          Positioned(
            top: 34,
            left: 86,
            child: _InfoBubble(
              icon: Icons.bolt_rounded,
              color: authPrimaryBlue,
            ),
          ),
          Positioned(
            right: 0,
            bottom: 36,
            child: _InfoBubble(
              icon: Icons.check_circle_rounded,
              color: authPrimaryBlueDark,
            ),
          ),
        ],
      ),
    );
  }
}

class LoginIllustration extends StatelessWidget {
  const LoginIllustration({super.key});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 162,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Positioned(
            right: 18,
            bottom: 0,
            child: Container(
              width: 170,
              height: 104,
              decoration: BoxDecoration(
                color: authSurfaceBlue,
                borderRadius: BorderRadius.circular(30),
              ),
            ),
          ),
          Positioned(
            right: 26,
            bottom: 6,
            child: const _PhoneFrame(
              width: 98,
              height: 150,
              child: _SecurePhoneScreen(),
            ),
          ),
          const Positioned(
            left: 26,
            bottom: 4,
            child: _MiniFigure(),
          ),
          const Positioned(
            left: 12,
            bottom: 0,
            child: _PlantCluster(scale: 0.85),
          ),
        ],
      ),
    );
  }
}

class RegisterIllustration extends StatelessWidget {
  const RegisterIllustration({super.key});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 122,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Positioned(
            left: 34,
            right: 34,
            top: 22,
            bottom: 6,
            child: Container(
              decoration: BoxDecoration(
                color: authSurfaceBlue,
                borderRadius: BorderRadius.circular(28),
              ),
            ),
          ),
          Positioned(
            left: 52,
            top: 12,
            child: Transform.rotate(
              angle: -math.pi / 30,
              child: const _MiniPanel(),
            ),
          ),
          Positioned(
            right: 46,
            top: 0,
            child: Transform.rotate(
              angle: math.pi / 36,
              child: const _MiniPanel(
                highlighted: false,
              ),
            ),
          ),
          Positioned(
            right: 20,
            bottom: 8,
            child: Container(
              width: 42,
              height: 42,
              decoration: const BoxDecoration(
                color: authPrimaryBlue,
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.person_add_alt_1_rounded,
                color: Colors.white,
                size: 20,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _AuthBackground extends StatelessWidget {
  const _AuthBackground();

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFFEEF2FF), Color(0xFFF8FAFF)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: const SizedBox.expand(),
    );
  }
}

class _Bubble extends StatelessWidget {
  const _Bubble({required this.size, required this.color});

  final double size;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: color,
        shape: BoxShape.circle,
      ),
    );
  }
}

class _BackChip extends StatelessWidget {
  const _BackChip({this.onPressed});

  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(14),
      elevation: 0,
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: onPressed ?? () => Navigator.of(context).maybePop(),
        child: Container(
          width: 46,
          height: 46,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: authFieldBorder),
            boxShadow: const [
              BoxShadow(
                color: Color(0x12000000),
                blurRadius: 14,
                offset: Offset(0, 8),
              ),
            ],
          ),
          child: const Icon(
            Icons.arrow_back_ios_new_rounded,
            size: 18,
            color: authTextDark,
          ),
        ),
      ),
    );
  }
}

class _PhoneFrame extends StatelessWidget {
  const _PhoneFrame({
    required this.width,
    required this.height,
    required this.child,
  });

  final double width;
  final double height;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      height: height,
      padding: const EdgeInsets.all(7),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [authPrimaryBlueDark, authPrimaryBlue],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(width * 0.27),
        boxShadow: const [
          BoxShadow(
            color: Color(0x241597F5),
            blurRadius: 26,
            offset: Offset(0, 14),
          ),
        ],
      ),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(width * 0.22),
        ),
        child: Column(
          children: [
            const SizedBox(height: 10),
            Container(
              width: width * 0.26,
              height: 5,
              decoration: BoxDecoration(
                color: const Color(0xFFD4E5F6),
                borderRadius: BorderRadius.circular(999),
              ),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(12, 10, 12, 12),
                child: child,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _WelcomePhoneScreen extends StatelessWidget {
  const _WelcomePhoneScreen();

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Container(
          width: 52,
          height: 52,
          decoration: BoxDecoration(
            color: authSurfaceBlue,
            borderRadius: BorderRadius.circular(18),
          ),
          child: const Icon(
            Icons.receipt_long_rounded,
            color: authPrimaryBlueDark,
            size: 28,
          ),
        ),
        const SizedBox(height: 14),
        const _PhoneLine(widthFactor: 0.7),
        const SizedBox(height: 8),
        const _PhoneLine(widthFactor: 0.92, light: true),
        const SizedBox(height: 16),
        const _PhoneLine(widthFactor: 0.62),
        const SizedBox(height: 8),
        const _PhoneLine(widthFactor: 0.82, light: true),
      ],
    );
  }
}

class _SecurePhoneScreen extends StatelessWidget {
  const _SecurePhoneScreen();

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Expanded(
          child: Center(
            child: Container(
              width: 58,
              height: 58,
              decoration: const BoxDecoration(
                color: authSurfaceBlue,
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.lock_rounded,
                color: authPrimaryBlueDark,
                size: 28,
              ),
            ),
          ),
        ),
        const _PhoneLine(widthFactor: 0.78),
        const SizedBox(height: 8),
        const _PhoneLine(widthFactor: 0.94, light: true),
        const SizedBox(height: 14),
        Container(
          width: double.infinity,
          height: 12,
          decoration: BoxDecoration(
            color: authPrimaryBlue,
            borderRadius: BorderRadius.circular(999),
          ),
        ),
      ],
    );
  }
}

class _PhoneLine extends StatelessWidget {
  const _PhoneLine({required this.widthFactor, this.light = false});

  final double widthFactor;
  final bool light;

  @override
  Widget build(BuildContext context) {
    return FractionallySizedBox(
      widthFactor: widthFactor,
      child: Container(
        height: 8,
        decoration: BoxDecoration(
          color: light ? const Color(0xFFE7EEF6) : const Color(0xFFCADCED),
          borderRadius: BorderRadius.circular(999),
        ),
      ),
    );
  }
}

class _StandingFigure extends StatelessWidget {
  const _StandingFigure();

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 82,
      height: 126,
      child: Stack(
        children: [
          Positioned(
            top: 0,
            left: 32,
            child: Container(
              width: 16,
              height: 16,
              decoration: const BoxDecoration(
                color: Color(0xFFF0C19E),
                shape: BoxShape.circle,
              ),
            ),
          ),
          Positioned(
            top: 16,
            left: 26,
            child: Container(
              width: 26,
              height: 36,
              decoration: BoxDecoration(
                color: const Color(0xFF2D425B),
                borderRadius: BorderRadius.circular(14),
              ),
            ),
          ),
          Positioned(
            top: 24,
            left: 10,
            child: Transform.rotate(
              angle: -math.pi / 4,
              child: Container(
                width: 30,
                height: 6,
                decoration: BoxDecoration(
                  color: const Color(0xFF2D425B),
                  borderRadius: BorderRadius.circular(999),
                ),
              ),
            ),
          ),
          Positioned(
            top: 24,
            left: 44,
            child: Transform.rotate(
              angle: math.pi / 4,
              child: Container(
                width: 30,
                height: 6,
                decoration: BoxDecoration(
                  color: const Color(0xFF2D425B),
                  borderRadius: BorderRadius.circular(999),
                ),
              ),
            ),
          ),
          Positioned(
            top: 44,
            left: 24,
            child: Transform.rotate(
              angle: math.pi / 18,
              child: Container(
                width: 14,
                height: 40,
                decoration: BoxDecoration(
                  color: authPrimaryBlue,
                  borderRadius: BorderRadius.circular(999),
                ),
              ),
            ),
          ),
          Positioned(
            top: 48,
            left: 42,
            child: Transform.rotate(
              angle: -math.pi / 28,
              child: Container(
                width: 14,
                height: 36,
                decoration: BoxDecoration(
                  color: const Color(0xFF1F2E43),
                  borderRadius: BorderRadius.circular(999),
                ),
              ),
            ),
          ),
          Positioned(
            bottom: 22,
            left: 20,
            child: Transform.rotate(
              angle: math.pi / 5,
              child: Container(
                width: 12,
                height: 42,
                decoration: BoxDecoration(
                  color: const Color(0xFF1F2E43),
                  borderRadius: BorderRadius.circular(999),
                ),
              ),
            ),
          ),
          Positioned(
            bottom: 14,
            right: 20,
            child: Transform.rotate(
              angle: -math.pi / 8,
              child: Container(
                width: 12,
                height: 46,
                decoration: BoxDecoration(
                  color: const Color(0xFF1F2E43),
                  borderRadius: BorderRadius.circular(999),
                ),
              ),
            ),
          ),
          Positioned(
            bottom: 12,
            left: 12,
            child: Container(
              width: 18,
              height: 6,
              decoration: BoxDecoration(
                color: const Color(0xFF2D425B),
                borderRadius: BorderRadius.circular(999),
              ),
            ),
          ),
          Positioned(
            bottom: 0,
            right: 10,
            child: Container(
              width: 18,
              height: 6,
              decoration: BoxDecoration(
                color: const Color(0xFF2D425B),
                borderRadius: BorderRadius.circular(999),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _MiniFigure extends StatelessWidget {
  const _MiniFigure();

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 74,
      height: 96,
      child: Stack(
        children: [
          Positioned(
            top: 0,
            left: 24,
            child: Container(
              width: 14,
              height: 14,
              decoration: const BoxDecoration(
                color: Color(0xFFF0C19E),
                shape: BoxShape.circle,
              ),
            ),
          ),
          Positioned(
            top: 14,
            left: 18,
            child: Container(
              width: 24,
              height: 32,
              decoration: BoxDecoration(
                color: const Color(0xFF2D425B),
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
          Positioned(
            top: 30,
            left: 0,
            child: Transform.rotate(
              angle: -math.pi / 7,
              child: Container(
                width: 22,
                height: 6,
                decoration: BoxDecoration(
                  color: const Color(0xFF2D425B),
                  borderRadius: BorderRadius.circular(999),
                ),
              ),
            ),
          ),
          Positioned(
            top: 34,
            right: 8,
            child: Transform.rotate(
              angle: math.pi / 8,
              child: Container(
                width: 24,
                height: 6,
                decoration: BoxDecoration(
                  color: const Color(0xFF2D425B),
                  borderRadius: BorderRadius.circular(999),
                ),
              ),
            ),
          ),
          Positioned(
            top: 44,
            left: 16,
            child: Container(
              width: 12,
              height: 24,
              decoration: BoxDecoration(
                color: authPrimaryBlue,
                borderRadius: BorderRadius.circular(999),
              ),
            ),
          ),
          Positioned(
            top: 48,
            left: 34,
            child: Container(
              width: 12,
              height: 20,
              decoration: BoxDecoration(
                color: const Color(0xFF1F2E43),
                borderRadius: BorderRadius.circular(999),
              ),
            ),
          ),
          Positioned(
            bottom: 16,
            left: 12,
            child: Transform.rotate(
              angle: math.pi / 6,
              child: Container(
                width: 10,
                height: 28,
                decoration: BoxDecoration(
                  color: const Color(0xFF1F2E43),
                  borderRadius: BorderRadius.circular(999),
                ),
              ),
            ),
          ),
          Positioned(
            bottom: 8,
            right: 18,
            child: Transform.rotate(
              angle: -math.pi / 10,
              child: Container(
                width: 10,
                height: 32,
                decoration: BoxDecoration(
                  color: const Color(0xFF1F2E43),
                  borderRadius: BorderRadius.circular(999),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _PlantCluster extends StatelessWidget {
  const _PlantCluster({this.scale = 1});

  final double scale;

  @override
  Widget build(BuildContext context) {
    return Transform.scale(
      scale: scale,
      alignment: Alignment.bottomLeft,
      child: SizedBox(
        width: 54,
        height: 54,
        child: Stack(
          children: const [
            Positioned(
              left: 0,
              bottom: 0,
              child: _Leaf(angle: -0.4, height: 28),
            ),
            Positioned(
              left: 16,
              bottom: 6,
              child: _Leaf(angle: 0, height: 34),
            ),
            Positioned(
              left: 30,
              bottom: 0,
              child: _Leaf(angle: 0.35, height: 30),
            ),
          ],
        ),
      ),
    );
  }
}

class _Leaf extends StatelessWidget {
  const _Leaf({
    required this.angle,
    required this.height,
  });

  final double angle;
  final double height;

  @override
  Widget build(BuildContext context) {
    return Transform.rotate(
      angle: angle,
      child: Container(
        width: 14,
        height: height,
        decoration: BoxDecoration(
          color: const Color(0xFF8BD1FF),
          borderRadius: BorderRadius.circular(999),
        ),
      ),
    );
  }
}

class _InfoBubble extends StatelessWidget {
  const _InfoBubble({
    required this.icon,
    required this.color,
  });

  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 34,
      height: 34,
      decoration: BoxDecoration(
        color: Colors.white,
        shape: BoxShape.circle,
        border: Border.all(color: const Color(0xFFE3EEF8)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x12162033),
            blurRadius: 12,
            offset: Offset(0, 6),
          ),
        ],
      ),
      child: Icon(icon, color: color, size: 18),
    );
  }
}

class _MiniPanel extends StatelessWidget {
  const _MiniPanel({this.highlighted = true});

  final bool highlighted;

  @override
  Widget build(BuildContext context) {
    final accent = highlighted ? authPrimaryBlue : const Color(0xFFB8C7D9);

    return Container(
      width: 106,
      height: 74,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: const Color(0xFFE2EEF9)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x12162033),
            blurRadius: 18,
            offset: Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 26,
            height: 26,
            decoration: BoxDecoration(
              color: const Color(0xFFEAF6FF),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              highlighted ? Icons.person_outline_rounded : Icons.mail_outline,
              color: accent,
              size: 16,
            ),
          ),
          const SizedBox(height: 10),
          Container(
            width: 52,
            height: 7,
            decoration: BoxDecoration(
              color: accent,
              borderRadius: BorderRadius.circular(999),
            ),
          ),
          const SizedBox(height: 6),
          Container(
            width: 66,
            height: 6,
            decoration: BoxDecoration(
              color: const Color(0xFFE7EEF6),
              borderRadius: BorderRadius.circular(999),
            ),
          ),
        ],
      ),
    );
  }
}
