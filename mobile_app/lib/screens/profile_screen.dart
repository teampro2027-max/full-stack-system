import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/language_provider.dart';
import '../services/api_service.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final lang = Provider.of<LanguageProvider>(context);
    final auth = Provider.of<AuthProvider>(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(lang.t('profile'), style: const TextStyle(fontWeight: FontWeight.bold)),
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            // Header
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(32),
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [Color(0xFF4F46E5), Color(0xFF6366F1)],
                  begin: Alignment.topLeft, end: Alignment.bottomRight,
                ),
              ),
              child: Column(children: [
                Container(
                  width: 80, height: 80,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                    boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.15), blurRadius: 20)],
                  ),
                  child: const Center(child: Text('U', style: TextStyle(fontSize: 36, fontWeight: FontWeight.bold, color: Color(0xFF4F46E5)))),
                ),
                const SizedBox(height: 12),
                const Text('User Account', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
                const Text('user@multibill.app', style: TextStyle(color: Colors.white70)),
              ]),
            ),

            const SizedBox(height: 8),

            // Language Setting
            _section(lang.t('language'), [
              _langTile(context, lang, 'en', 'ðŸ‡ºðŸ‡¸ English'),
              _langTile(context, lang, 'so', 'ðŸ‡¸ðŸ‡´ Somali (Af Soomaali)'),
            ]),

            // Security Settings
            _section('Security', [
              _tile(icon: Icons.security, title: lang.t('mfa'), subtitle: 'Two-factor authentication',
                trailing: Switch(
                  value: auth.user?['mfaEnabled'] ?? false,
                  onChanged: (v) async {
                    if (v) {
                      final success = await Navigator.pushNamed(context, '/mfa-setup');
                      if (success == true) auth.checkAuth(); // Refresh user data
                    } else {
                      try {
                        await ApiService.post('/auth/mfa/disable', {});
                        auth.checkAuth();
                      } catch (e) {
                         ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
                      }
                    }
                  },
                  activeColor: const Color(0xFF4F46E5),
                )),
              _tile(icon: Icons.lock_outline, title: 'AES-256 Encryption', subtitle: 'Your data is end-to-end encrypted',
                trailing: const Icon(Icons.check_circle, color: Colors.green)),
            ]),

            // Notifications
            _section(lang.t('notifications'), [
              _tile(icon: Icons.notifications_outlined, title: 'Push Notifications', subtitle: 'Bill due reminders',
                trailing: Switch(value: true, onChanged: (_) {}, activeColor: const Color(0xFF4F46E5))),
              _tile(icon: Icons.alarm, title: 'Reminder Days', subtitle: '1â€“3 days before due date',
                trailing: const Text('3 days', style: TextStyle(color: Color(0xFF4F46E5), fontWeight: FontWeight.w600))),
            ]),

            // About
            _section('About', [
              _tile(icon: Icons.info_outline, title: 'App Version', subtitle: '2.0.0 (Production Ready)'),
              _tile(icon: Icons.language, title: 'Multi-language', subtitle: 'English & Somali supported'),
              _tile(icon: Icons.storage, title: 'Database', subtitle: 'MongoDB + Redis Caching'),
            ]),

            // Logout
            Padding(
              padding: const EdgeInsets.all(20),
              child: ElevatedButton.icon(
                icon: const Icon(Icons.logout, color: Colors.white),
                label: Text(lang.t('logout'), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                onPressed: () async {
                  await auth.logout();
                  if (!context.mounted) return;
                  Navigator.of(context).pushReplacementNamed('/login');
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.red.shade500,
                  minimumSize: const Size(double.infinity, 52),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _section(String title, List<Widget> children) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Padding(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
        child: Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF4F46E5), letterSpacing: 0.5)),
      ),
      Container(
        margin: const EdgeInsets.symmetric(horizontal: 16),
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16),
            boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10)]),
        child: Column(children: children.map((w) => w).toList()),
      ),
    ],
  );

  Widget _tile({required IconData icon, required String title, String? subtitle, Widget? trailing}) => ListTile(
    leading: Container(width: 36, height: 36,
        decoration: BoxDecoration(color: const Color(0xFF4F46E5).withOpacity(0.1), borderRadius: BorderRadius.circular(10)),
        child: Icon(icon, color: const Color(0xFF4F46E5), size: 18)),
    title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
    subtitle: subtitle != null ? Text(subtitle, style: TextStyle(fontSize: 12, color: Colors.grey.shade500)) : null,
    trailing: trailing,
  );

  Widget _langTile(BuildContext context, LanguageProvider lang, String code, String label) => ListTile(
    leading: Container(width: 36, height: 36,
        decoration: BoxDecoration(
          color: lang.lang == code ? const Color(0xFF4F46E5) : Colors.grey.shade100,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Center(child: Text(code.toUpperCase(), style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11,
            color: lang.lang == code ? Colors.white : Colors.grey.shade600)))),
    title: Text(label, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
    trailing: lang.lang == code ? const Icon(Icons.check_circle, color: Color(0xFF4F46E5)) : null,
    onTap: () => lang.setLang(code),
  );
}
