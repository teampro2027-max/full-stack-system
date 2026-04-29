import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/language_provider.dart';
import '../providers/auth_provider.dart';
import 'mfa_setup_screen.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final lang = Provider.of<LanguageProvider>(context);
    final auth = Provider.of<AuthProvider>(context);

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text(
          lang.t('settings'),
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
          ),
        ),
        backgroundColor: const Color(0xFF4F46E5),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: Colors.white, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildSectionHeader(lang.t('general')),
            _buildSettingCard(
              children: [
                _buildLanguageTile(context, lang),
              ],
            ),
            _buildSectionHeader(lang.t('security')),
            _buildSettingCard(
              children: [
                ListTile(
                  leading: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.orange.shade50,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.security, color: Colors.orange, size: 20),
                  ),
                  title: Text(
                    lang.t('mfa'),
                    style: const TextStyle(fontWeight: FontWeight.w600),
                  ),
                  subtitle: Text(
                    'Secure your account with 2FA',
                    style: TextStyle(color: Colors.grey.shade500, fontSize: 13),
                  ),
                  trailing: const Icon(Icons.chevron_right, size: 18),
                  onTap: () => Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const MfaSetupScreen()),
                  ),
                ),
              ],
            ),
            _buildSectionHeader('Info'),
            _buildSettingCard(
              children: [
                _buildInfoTile(
                  icon: Icons.info_outline,
                  iconColor: Colors.blue,
                  title: 'App Version',
                  value: '1.0.0',
                ),
                const Divider(height: 1),
                _buildInfoTile(
                  icon: Icons.policy_outlined,
                  iconColor: Colors.green,
                  title: 'Privacy Policy',
                  onTap: () {},
                ),
              ],
            ),
            const SizedBox(height: 40),
            Center(
              child: Text(
                'Powering your payments securely.',
                style: TextStyle(
                  color: Colors.grey.shade400,
                  fontSize: 12,
                  fontStyle: FontStyle.italic,
                ),
              ),
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 24, 20, 12),
      child: Text(
        title.toUpperCase(),
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.bold,
          color: Colors.grey.shade600,
          letterSpacing: 1.1,
        ),
      ),
    );
  }

  Widget _buildSettingCard({required List<Widget> children}) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(children: children),
    );
  }

  Widget _buildLanguageTile(BuildContext context, LanguageProvider lang) {
    return ListTile(
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: Colors.blue.shade50,
          borderRadius: BorderRadius.circular(10),
        ),
        child: const Icon(Icons.language, color: Colors.blue, size: 20),
      ),
      title: Text(
        lang.t('language'),
        style: const TextStyle(fontWeight: FontWeight.w600),
      ),
      trailing: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: const Color(0xFF4F46E5).withOpacity(0.1),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          lang.lang == 'en' ? 'English' : 'Soomaali',
          style: const TextStyle(
            color: Color(0xFF4F46E5),
            fontSize: 12,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      onTap: () => _showLanguagePicker(context, lang),
    );
  }

  Widget _buildInfoTile({
    required IconData icon,
    required Color iconColor,
    required String title,
    String? value,
    VoidCallback? onTap,
  }) {
    return ListTile(
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: iconColor.withOpacity(0.1),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, color: iconColor, size: 20),
      ),
      title: Text(
        title,
        style: const TextStyle(fontWeight: FontWeight.w600),
      ),
      trailing: value != null
          ? Text(
              value,
              style: TextStyle(color: Colors.grey.shade500, fontSize: 13),
            )
          : const Icon(Icons.chevron_right, size: 18),
      onTap: onTap,
    );
  }

  void _showLanguagePicker(BuildContext context, LanguageProvider lang) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Container(
        padding: const EdgeInsets.symmetric(vertical: 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'Select Language',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 20),
            ListTile(
              leading: const Text('ðŸ‡ºðŸ‡¸', style: TextStyle(fontSize: 24)),
              title: const Text('English'),
              trailing: lang.lang == 'en' ? const Icon(Icons.check_circle, color: Color(0xFF4F46E5)) : null,
              onTap: () {
                lang.setLang('en');
                Navigator.pop(context);
              },
            ),
            ListTile(
              leading: const Text('ðŸ‡¸ðŸ‡´', style: TextStyle(fontSize: 24)),
              title: const Text('Soomaali'),
              trailing: lang.lang == 'so' ? const Icon(Icons.check_circle, color: Color(0xFF4F46E5)) : null,
              onTap: () {
                lang.setLang('so');
                Navigator.pop(context);
              },
            ),
          ],
        ),
      ),
    );
  }
}
