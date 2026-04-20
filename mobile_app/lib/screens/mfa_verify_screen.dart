import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';

class MfaVerifyScreen extends StatefulWidget {
  final String email;
  final String password;

  const MfaVerifyScreen({Key? key, required this.email, required this.password}) : super(key: key);

  @override
  _MfaVerifyScreenState createState() => _MfaVerifyScreenState();
}

class _MfaVerifyScreenState extends State<MfaVerifyScreen> {
  final _codeController = TextEditingController();
  bool _loading = false;

  Future<void> _verify() async {
    if (_codeController.text.length != 6) return;
    setState(() => _loading = true);
    
    try {
      // We'll call a specialized login method that includes the token
      await Provider.of<AuthProvider>(context, listen: false)
          .loginWithMfa(widget.email, widget.password, _codeController.text);
      if (!mounted) return;
      Navigator.of(context).pushReplacementNamed('/dashboard');
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Security Verification')),
      body: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.lock_person, size: 80, color: Color(0xFF4F46E5)),
            const SizedBox(height: 32),
            const Text(
              'Enter Security Code',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            const Text(
              'Enter the 6-digit code from your authenticator app to sign in.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey),
            ),
            const SizedBox(height: 48),
            TextField(
              controller: _codeController,
              keyboardType: TextInputType.number,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold, letterSpacing: 10),
              autofocus: true,
              decoration: const InputDecoration(
                hintText: '000000',
                counterText: '',
                border: InputBorder.none,
              ),
              maxLength: 6,
              onChanged: (v) {
                if (v.length == 6) _verify();
              },
            ),
            const SizedBox(height: 48),
            if (_loading)
              const CircularProgressIndicator()
            else
              ElevatedButton(
                onPressed: _verify,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF4F46E5),
                  minimumSize: const Size(double.infinity, 54),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text('Verify & Sign In', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              ),
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
          ],
        ),
      ),
    );
  }
}
