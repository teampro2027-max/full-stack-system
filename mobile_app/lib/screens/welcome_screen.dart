import 'package:flutter/material.dart';

class WelcomeScreen extends StatelessWidget {
  const WelcomeScreen({Key? key}) : super(key: key);

  static const _purple = Color(0xFF4F46E5);
  static const _deepPurple = Color(0xFF352EDB);
  static const _softPurple = Color(0xFF7C73FF);
  static const _ink = Color(0xFF10213D);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          const Positioned.fill(child: _PurpleBackground()),
          SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.fromLTRB(24, 24, 24, 24),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(32),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.12),
                          blurRadius: 28,
                          offset: const Offset(0, 16),
                        ),
                      ],
                    ),
                    child: Column(
                      children: [
                        const _SliderDots(),
                        const SizedBox(height: 22),
                        const Text(
                          'Quickly track due dates, payments, and invoices with one clean dashboard.',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: Color(0xFF4B5563),
                            fontSize: 17,
                            height: 1.5,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(height: 24),
                        const _BillIllustration(),
                      ],
                    ),
                  ),
                  const SizedBox(height: 30),
                  _WelcomeButton(
                    label: 'Login',
                    icon: Icons.arrow_forward_rounded,
                    filled: true,
                    onPressed: () => Navigator.of(context).pushNamed('/login'),
                  ),
                  const SizedBox(height: 18),
                  _WelcomeButton(
                    label: 'Sign Up',
                    icon: Icons.person_add_alt_1_outlined,
                    filled: false,
                    onPressed: () =>
                        Navigator.of(context).pushNamed('/register'),
                  ),
                  const SizedBox(height: 28),
                  const _SecureFooter(),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _PurpleBackground extends StatelessWidget {
  const _PurpleBackground();

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [
            WelcomeScreen._softPurple,
            WelcomeScreen._purple,
            WelcomeScreen._deepPurple,
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: CustomPaint(painter: _BackgroundPainter()),
    );
  }
}

class _FeatureCard extends StatelessWidget {
  const _FeatureCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(24, 36, 24, 28),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(34),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.13),
            blurRadius: 36,
            offset: const Offset(0, 18),
          ),
        ],
      ),
      child: Column(
        children: [
          const _PhoneHalo(),
          const SizedBox(height: 26),
          RichText(
            textAlign: TextAlign.center,
            text: const TextSpan(
              style: TextStyle(
                color: WelcomeScreen._ink,
                fontSize: 24,
                height: 1.26,
                fontWeight: FontWeight.w800,
                letterSpacing: 0,
              ),
              children: [
                TextSpan(text: 'Keep every bill in one place\nand '),
                TextSpan(
                  text: 'pay on time.',
                  style: TextStyle(color: WelcomeScreen._purple),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          const _SliderDots(),
          const SizedBox(height: 24),
          const Text(
            'Quickly track due dates, payments, and\ninvoices with one clean dashboard.',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Color(0xFF5D6474),
              fontSize: 16,
              height: 1.45,
              fontWeight: FontWeight.w500,
              letterSpacing: 0,
            ),
          ),
          const SizedBox(height: 34),
          const _BillIllustration(),
        ],
      ),
    );
  }
}

class _PhoneHalo extends StatelessWidget {
  const _PhoneHalo();

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 190,
      height: 190,
      child: Stack(
        alignment: Alignment.center,
        children: [
          Container(
            width: 170,
            height: 170,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: const Color(0xFFE9E9FF),
              boxShadow: [
                BoxShadow(
                  color: WelcomeScreen._purple.withOpacity(0.12),
                  blurRadius: 34,
                  spreadRadius: 12,
                ),
              ],
            ),
          ),
          Container(
            width: 118,
            height: 118,
            decoration: const BoxDecoration(
              shape: BoxShape.circle,
              color: Color(0xFFF7FAFF),
            ),
          ),
          const Icon(
            Icons.phone_iphone_rounded,
            size: 72,
            color: WelcomeScreen._purple,
          ),
          const Positioned(top: 14, left: 24, child: _Sparkle(size: 26)),
          const Positioned(top: 50, left: 8, child: _Sparkle(size: 18)),
          const Positioned(bottom: 38, right: 8, child: _Sparkle(size: 24)),
          const Positioned(bottom: 14, right: 42, child: _Sparkle(size: 20)),
          const Positioned(left: 0, bottom: 58, child: _MiniDots()),
          const Positioned(right: 0, bottom: 50, child: _MiniDots()),
        ],
      ),
    );
  }
}

class _SliderDots extends StatelessWidget {
  const _SliderDots();

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(width: 34, height: 3, color: WelcomeScreen._purple),
        const SizedBox(width: 12),
        Container(
          width: 10,
          height: 10,
          decoration: const BoxDecoration(
            color: WelcomeScreen._purple,
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(width: 12),
        Container(width: 34, height: 3, color: WelcomeScreen._purple),
      ],
    );
  }
}

class _BillIllustration extends StatelessWidget {
  const _BillIllustration();

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 190,
      child: Stack(
        alignment: Alignment.bottomCenter,
        children: [
          Container(
            width: 280,
            height: 24,
            decoration: BoxDecoration(
              color: const Color(0xFFF1F4FF),
              borderRadius: BorderRadius.circular(50),
              boxShadow: [
                BoxShadow(
                  color: WelcomeScreen._purple.withOpacity(0.18),
                  blurRadius: 18,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
          ),
          Positioned(
            left: 22,
            bottom: 18,
            child: Column(
              children: [
                Container(
                  width: 60,
                  height: 62,
                  decoration: const BoxDecoration(
                    color: WelcomeScreen._softPurple,
                    borderRadius: BorderRadius.vertical(
                      top: Radius.circular(30),
                      bottom: Radius.circular(12),
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Color(0x554F46E5),
                        blurRadius: 18,
                        offset: Offset(0, 10),
                      ),
                    ],
                  ),
                  child: const Icon(
                    Icons.notifications_rounded,
                    color: Colors.white,
                    size: 36,
                  ),
                ),
                const SizedBox(height: 6),
                const _Leaves(),
              ],
            ),
          ),
          Positioned(
            bottom: 28,
            child: Container(
              width: 166,
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.09),
                    blurRadius: 22,
                    offset: const Offset(0, 12),
                  ),
                ],
              ),
              child: const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Due Soon',
                    style: TextStyle(
                      color: WelcomeScreen._ink,
                      fontWeight: FontWeight.w800,
                      fontSize: 13,
                    ),
                  ),
                  SizedBox(height: 10),
                  _BillRow(date: 'May 20, 2024', amount: '\$120.00', red: true),
                  SizedBox(height: 10),
                  _BillRow(date: 'May 25, 2024', amount: '\$60.00', red: false),
                ],
              ),
            ),
          ),
          Positioned(
            right: 28,
            bottom: 74,
            child: Container(
              width: 74,
              height: 70,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.1),
                    blurRadius: 16,
                    offset: const Offset(0, 10),
                  ),
                ],
              ),
              child: Stack(
                children: [
                  Container(
                    height: 24,
                    decoration: const BoxDecoration(
                      color: WelcomeScreen._softPurple,
                      borderRadius: BorderRadius.vertical(
                        top: Radius.circular(16),
                      ),
                    ),
                  ),
                  const Positioned(left: 14, top: -5, child: _CalendarRing()),
                  const Positioned(right: 14, top: -5, child: _CalendarRing()),
                  Positioned.fill(
                    top: 30,
                    child: GridView.count(
                      crossAxisCount: 3,
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      physics: const NeverScrollableScrollPhysics(),
                      mainAxisSpacing: 5,
                      crossAxisSpacing: 5,
                      children: List.generate(
                        6,
                        (_) => Container(
                          decoration: BoxDecoration(
                            color: const Color(0xFFE8EDFF),
                            borderRadius: BorderRadius.circular(4),
                          ),
                        ),
                      ),
                    ),
                  ),
                  Positioned(
                    right: -3,
                    bottom: -3,
                    child: Container(
                      width: 34,
                      height: 34,
                      decoration: const BoxDecoration(
                        color: WelcomeScreen._softPurple,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.check_rounded,
                        color: Colors.white,
                        size: 22,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          Positioned(
            right: 76,
            bottom: 14,
            child: Container(
              width: 58,
              height: 58,
              decoration: BoxDecoration(
                color: const Color(0xFFFFBF31),
                shape: BoxShape.circle,
                border: Border.all(color: const Color(0xFFFFD76B), width: 5),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFFFFB020).withOpacity(0.32),
                    blurRadius: 18,
                    offset: const Offset(0, 10),
                  ),
                ],
              ),
              child: const Icon(
                Icons.attach_money_rounded,
                color: Colors.white,
                size: 34,
              ),
            ),
          ),
          const Positioned(right: 22, bottom: 15, child: _Leaves()),
        ],
      ),
    );
  }
}

class _BillRow extends StatelessWidget {
  const _BillRow({required this.date, required this.amount, required this.red});

  final String date;
  final String amount;
  final bool red;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 9),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 12,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: Text(
              date,
              style: TextStyle(
                color: red ? const Color(0xFFFF4D62) : const Color(0xFF2ECC71),
                fontSize: 10,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
          Text(
            amount,
            style: const TextStyle(
              color: WelcomeScreen._ink,
              fontSize: 10,
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }
}

class _WelcomeButton extends StatelessWidget {
  const _WelcomeButton({
    required this.label,
    required this.icon,
    required this.filled,
    required this.onPressed,
  });

  final String label;
  final IconData icon;
  final bool filled;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 72,
      child: filled
          ? ElevatedButton.icon(
              onPressed: onPressed,
              icon: Icon(icon, size: 32),
              label: Text(label),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: WelcomeScreen._purple,
                elevation: 0,
                textStyle: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 0,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(26),
                ),
              ),
            )
          : OutlinedButton.icon(
              onPressed: onPressed,
              icon: Icon(icon, size: 32),
              label: Text(label),
              style: OutlinedButton.styleFrom(
                foregroundColor: Colors.white,
                side: const BorderSide(color: Colors.white, width: 1.4),
                textStyle: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 0,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(26),
                ),
              ),
            ),
    );
  }
}

class _SecureFooter extends StatelessWidget {
  const _SecureFooter();

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 92,
      child: Stack(
        alignment: Alignment.bottomCenter,
        children: [
          Positioned.fill(child: CustomPaint(painter: _WavePainter())),
          Padding(
            padding: const EdgeInsets.only(bottom: 18),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: const [
                Icon(
                  Icons.verified_user_outlined,
                  color: WelcomeScreen._softPurple,
                  size: 28,
                ),
                SizedBox(width: 16),
                Text(
                  'Your data is safe and secure\nwith us.',
                  style: TextStyle(
                    color: Color(0xFF7A8195),
                    fontSize: 15,
                    height: 1.25,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _Sparkle extends StatelessWidget {
  const _Sparkle({required this.size});

  final double size;

  @override
  Widget build(BuildContext context) {
    return Icon(
      Icons.auto_awesome_rounded,
      size: size,
      color: WelcomeScreen._softPurple,
    );
  }
}

class _MiniDots extends StatelessWidget {
  const _MiniDots();

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 42,
      height: 42,
      child: Wrap(
        spacing: 8,
        runSpacing: 8,
        children: List.generate(
          12,
          (_) => Container(
            width: 4,
            height: 4,
            decoration: BoxDecoration(
              color: WelcomeScreen._softPurple.withOpacity(0.25),
              shape: BoxShape.circle,
            ),
          ),
        ),
      ),
    );
  }
}

class _CalendarRing extends StatelessWidget {
  const _CalendarRing();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 8,
      height: 18,
      decoration: BoxDecoration(
        color: const Color(0xFF6E63FF),
        borderRadius: BorderRadius.circular(99),
      ),
    );
  }
}

class _Leaves extends StatelessWidget {
  const _Leaves();

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 50,
      height: 38,
      child: CustomPaint(painter: _LeavesPainter()),
    );
  }
}

class _BackgroundPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final pale = Paint()..color = Colors.white.withOpacity(0.14);
    final faint = Paint()..color = Colors.white.withOpacity(0.08);

    canvas.drawCircle(Offset(size.width * 0.9, size.height * 0.03), 118, pale);
    canvas.drawCircle(Offset(size.width * 0.82, size.height * 0.17), 34, faint);
    canvas.drawCircle(
      Offset(size.width * 1.03, size.height * 0.55),
      112,
      faint,
    );

    for (var row = 0; row < 7; row++) {
      for (var col = 0; col < 7; col++) {
        canvas.drawCircle(
          Offset(18 + col * 22, 16 + row * 22),
          row.isEven ? 3.2 : 2.4,
          Paint()..color = Colors.white.withOpacity(0.2 - row * 0.018),
        );
      }
    }

    for (var row = 0; row < 7; row++) {
      for (var col = 0; col < 7; col++) {
        canvas.drawCircle(
          Offset(size.width - 120 + col * 20, size.height - 178 + row * 20),
          3,
          Paint()..color = Colors.white.withOpacity(0.14),
        );
      }
    }

    final wave = Paint()
      ..color = Colors.white.withOpacity(0.45)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 4
      ..strokeCap = StrokeCap.round;
    for (var i = 0; i < 3; i++) {
      final path = Path();
      final y = size.height * 0.12 + i * 10;
      path.moveTo(size.width - 66, y);
      path.cubicTo(
        size.width - 54,
        y + 12,
        size.width - 46,
        y - 12,
        size.width - 34,
        y,
      );
      path.cubicTo(
        size.width - 22,
        y + 12,
        size.width - 14,
        y - 12,
        size.width - 2,
        y,
      );
      canvas.drawPath(path, wave);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _WavePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final path = Path()
      ..moveTo(-30, size.height * 0.3)
      ..cubicTo(
        size.width * 0.16,
        size.height * 0.16,
        size.width * 0.18,
        size.height * 0.82,
        size.width * 0.42,
        size.height * 0.48,
      )
      ..cubicTo(
        size.width * 0.63,
        size.height * 0.22,
        size.width * 0.7,
        size.height * 1.02,
        size.width + 30,
        size.height * 0.36,
      )
      ..lineTo(size.width + 30, size.height)
      ..lineTo(-30, size.height)
      ..close();

    canvas.drawPath(
      path.shift(const Offset(0, 8)),
      Paint()..color = Colors.white.withOpacity(0.42),
    );
    canvas.drawPath(path, Paint()..color = Colors.white);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _LeavesPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final stem = Paint()
      ..color = const Color(0xFF67D2A3)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3
      ..strokeCap = StrokeCap.round;
    canvas.drawLine(
      Offset(size.width * 0.5, size.height),
      Offset(size.width * 0.5, size.height * 0.34),
      stem,
    );

    final leaf = Paint()..color = const Color(0xFF71D7AF);
    canvas.save();
    canvas.translate(size.width * 0.35, size.height * 0.65);
    canvas.rotate(-0.78);
    canvas.drawOval(
      Rect.fromCenter(center: Offset.zero, width: 16, height: 34),
      leaf,
    );
    canvas.restore();

    canvas.save();
    canvas.translate(size.width * 0.62, size.height * 0.52);
    canvas.rotate(0.68);
    canvas.drawOval(
      Rect.fromCenter(center: Offset.zero, width: 16, height: 34),
      leaf..color = const Color(0xFF56C998),
    );
    canvas.restore();
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
