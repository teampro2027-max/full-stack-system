import 'dart:convert';
import 'package:flutter/material.dart';
import '../services/api_service.dart';

class MfaSetupScreen extends StatefulWidget {
  const MfaSetupScreen({Key? key}) : super(key: key);

  @override
  _MfaSetupScreenState createState() => _MfaSetupScreenState();
}

class _MfaSetupScreenState extends State<MfaSetupScreen> {
  String? _qrCode;
  String? _secret;
  bool _loading = true;
  final _codeController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadSetup();
  }

  Future<void> _loadSetup() async {
    try {
      final res = await ApiService.get('/auth/mfa/setup');
      setState(() {
        _qrCode = res['mfaQrCode'];
        _secret = res['mfaSecret'];
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    }
  }

  Future<void> _enable() async {
    if (_codeController.text.length != 6) return;
    setState(() => _loading = true);
    try {
      await ApiService.post('/auth/mfa/enable', {'mfaToken': _codeController.text});
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('MFA Enabled Successfully âœ“')));
      Navigator.pop(context, true);
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
      appBar: AppBar(title: const Text('MFA Security Setup')),
      body: _loading 
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Column(children: [
                const Icon(Icons.verified_user, size: 64, color: Color(0xFF4F46E5)),
                const SizedBox(height: 24),
                const Text('Step 1: Scan QR Code', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                const Text('Use Google Authenticator or Microsoft Authenticator app to scan the code below.', textAlign: TextAlign.center),
                const SizedBox(height: 24),
                if (_qrCode != null)
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(border: Border.all(color: Colors.grey.shade300), borderRadius: BorderRadius.circular(16)),
                    child: Image.memory(base64Decode(_qrCode!.split(',').last), width: 200, height: 200),
                  ),
                const SizedBox(height: 16),
                if (_secret != null) ...[
                  const Text('Manual Secret Key:', style: TextStyle(fontSize: 12, color: Colors.grey)),
                  SelectableText(_secret!, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, letterSpacing: 1.5)),
                ],
                const SizedBox(height: 32),
                const Divider(),
                const SizedBox(height: 24),
                const Text('Step 2: Verify Code', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                const Text('Enter the 6-digit code from your app to confirm setup.'),
                const SizedBox(height: 16),
                TextField(
                  controller: _codeController,
                  keyboardType: TextInputType.number,
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, letterSpacing: 8),
                  decoration: InputDecoration(
                    hintText: '000000',
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: _enable,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF4F46E5),
                    minimumSize: const Size(double.infinity, 54),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text('Verify & Enable MFA', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                ),
              ]),
            ),
    );
  }
}
