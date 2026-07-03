import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_advanced_drawer/flutter_advanced_drawer.dart';
import '../services/api_service.dart';
import '../providers/auth_provider.dart';
import '../providers/bill_provider.dart';
import '../providers/language_provider.dart';
import 'add_bill_screen.dart';
import 'payment_screen.dart';
import 'payment_history_screen.dart';
import 'profile_screen.dart';
import 'notification_screen.dart';
import 'reports_screen.dart';
import 'settings_screen.dart';
import '../providers/notification_provider.dart';
import '../utils/category_helpers.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({Key? key}) : super(key: key);

  @override
  _DashboardScreenState createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  final _advancedDrawerController = AdvancedDrawerController();
  int _currentIndex = 0;

  final Map<String, Map<String, dynamic>> _categoryMeta = {
    'electricity': {'icon': '⚡', 'color': Color(0xFFF59E0B)},
    'water': {'icon': '💧', 'color': Color(0xFF3B82F6)},
    'internet': {'icon': '🌐', 'color': Color(0xFF10B981)},
    'rent': {'icon': '🏠', 'color': Color(0xFF8B5CF6)},
    'school_fees': {'icon': '🎓', 'color': Color(0xFFEF4444)},
    'mobile_postpaid': {'icon': '📱', 'color': Color(0xFFEC4899)},
    'tv_subscription': {'icon': '📺', 'color': Color(0xFF6366F1)},
    'waste_collection': {'icon': '🗑️', 'color': Color(0xFF84CC16)},
    'loan_installment': {'icon': '💰', 'color': Color(0xFFF97316)},
    'government_license': {'icon': '📋', 'color': Color(0xFF14B8A6)},
  };

  Timer? _statusTimer;

  void _startStatusCheck() {
    _statusTimer = Timer.periodic(const Duration(seconds: 5), (timer) async {
      try {
        final profile = await ApiService.get('/users/profile');
        final status = profile['status'] ?? 'active';
        if (status == 'suspended' || status == 'inactive') {
          timer.cancel();
          _showSuspensionDialog(status);
        }
      } catch (e) {
        if (e.toString().contains('403') ||
            e.toString().toLowerCase().contains('forbidden') ||
            e.toString().toLowerCase().contains('xanibay') ||
            e.toString().toLowerCase().contains('firfircoona')) {
          timer.cancel();
          final status = e.toString().toLowerCase().contains('firfircoona')
              ? 'inactive'
              : 'suspended';
          _showSuspensionDialog(status);
        }
      }
    });
  }

  void _showSuspensionDialog(String status) {
    if (!mounted) return;
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) {
        return PopScope(
          canPop: false,
          child: AlertDialog(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(20),
            ),
            title: Row(
              children: [
                const Icon(Icons.block, color: Colors.red, size: 28),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    status == 'suspended'
                        ? 'Akaunkaaga waa la xanibay!'
                        : 'Akaunkaaga ma firfircoona!',
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                      color: Colors.red,
                    ),
                  ),
                ),
              ],
            ),
            content: Text(
              status == 'suspended'
                  ? 'Koontadaada waa la xanibay (Suspended). Fadlan la xiriir maamulaha nidaamka si aad u hesho caawimaad.'
                  : 'Koontadaada hadda ma firfircoona (Inactive). Fadlan la xiriir maamulaha nidaamka si loo hawlgeliyo.',
              style: const TextStyle(fontSize: 13, height: 1.4),
            ),
            actions: [
              ElevatedButton.icon(
                onPressed: () async {
                  await Provider.of<AuthProvider>(
                    context,
                    listen: false,
                  ).logout();
                  if (!ctx.mounted) return;
                  Navigator.of(ctx).pop();
                  Navigator.of(
                    context,
                  ).pushNamedAndRemoveUntil('/login', (route) => false);
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.red,
                  foregroundColor: Colors.white,
                  minimumSize: const Size(double.infinity, 44),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                icon: const Icon(Icons.logout, size: 16),
                label: const Text(
                  'Ka Bax (Log Out)',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      Provider.of<BillProvider>(context, listen: false).fetchBills();
      Provider.of<NotificationProvider>(
        context,
        listen: false,
      ).fetchNotifications();
    });
    _startStatusCheck();
  }

  @override
  void dispose() {
    _statusTimer?.cancel();
    super.dispose();
  }

  String _daysLeft(String? dateStr) {
    if (dateStr == null) return '';
    final date = DateTime.tryParse(dateStr);
    if (date == null) return '';
    final diff = date.difference(DateTime.now()).inDays;
    if (diff < 0) return 'Overdue';
    if (diff == 0) return 'Due Today!';
    return 'Due in $diff days';
  }

  @override
  Widget build(BuildContext context) {
    final lang = Provider.of<LanguageProvider>(context);
    final bills = Provider.of<BillProvider>(context);
    final isCompactNav = MediaQuery.of(context).size.width < 430;

    final pages = [
      _buildHome(context, lang, bills),
      _buildBillsList(context, lang, bills),
      const ReportsScreen(),
      const PaymentHistoryScreen(),
    ];

    return AdvancedDrawer(
      backdrop: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFF4F46E5), Color(0xFF6366F1)],
          ),
        ),
      ),
      controller: _advancedDrawerController,
      animationCurve: Curves.easeInOut,
      animationDuration: const Duration(milliseconds: 300),
      animateChildDecoration: true,
      rtlOpening: false,
      disabledGestures: false,
      childDecoration: const BoxDecoration(
        borderRadius: BorderRadius.all(Radius.circular(16)),
      ),
      drawer: _buildAdvancedDrawer(context),
      child: Scaffold(
        key: _scaffoldKey,
        body: pages[_currentIndex],
        bottomNavigationBar: Container(
          decoration: BoxDecoration(
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.08),
                blurRadius: 20,
                offset: const Offset(0, -4),
              ),
            ],
          ),
          child: BottomNavigationBar(
            currentIndex: _currentIndex,
            onTap: (i) => setState(() => _currentIndex = i),
            type: BottomNavigationBarType.fixed,
            selectedItemColor: const Color(0xFF4F46E5),
            unselectedItemColor: Colors.grey.shade400,
            selectedFontSize: 10,
            unselectedFontSize: 10,
            showUnselectedLabels: !isCompactNav,
            selectedLabelStyle: const TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 10,
            ),
            elevation: 0,
            items: [
              BottomNavigationBarItem(
                icon: const Icon(Icons.home_outlined),
                activeIcon: const Icon(Icons.home),
                label: isCompactNav ? 'Home' : lang.t('dashboard'),
              ),
              BottomNavigationBarItem(
                icon: const Icon(Icons.receipt_long_outlined),
                activeIcon: const Icon(Icons.receipt_long),
                label: isCompactNav ? 'Bills' : lang.t('myBills'),
              ),
              BottomNavigationBarItem(
                icon: const Icon(Icons.bar_chart_outlined),
                activeIcon: const Icon(Icons.bar_chart),
                label: isCompactNav ? 'Reports' : lang.t('reports'),
              ),
              BottomNavigationBarItem(
                icon: const Icon(Icons.history_outlined),
                activeIcon: const Icon(Icons.history),
                label: isCompactNav ? 'History' : lang.t('paymentHistory'),
              ),
            ],
          ),
        ),
        floatingActionButton: _currentIndex == 1
            ? FloatingActionButton(
                backgroundColor: const Color(0xFF4F46E5),
                onPressed: () async {
                  final result = await Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const AddBillScreen()),
                  );
                  if (result == true) setState(() {});
                },
                child: const Icon(Icons.add, color: Colors.white),
              )
            : null,
      ),
    );
  }

  Widget _buildHome(
    BuildContext context,
    LanguageProvider lang,
    BillProvider bills,
  ) {
    final upcoming = bills.upcomingBills.take(3).toList();
    final overdue = bills.overdueBills;

    return CustomScrollView(
      slivers: [
        SliverAppBar(
          expandedHeight: 200,
          pinned: true,
          automaticallyImplyLeading: false,
          leading: IconButton(
            icon: const Icon(Icons.menu, color: Colors.white),
            onPressed: () => _advancedDrawerController.showDrawer(),
          ),
          flexibleSpace: FlexibleSpaceBar(
            background: Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [Color(0xFF4F46E5), Color(0xFF6366F1)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
              child: SafeArea(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      Text(
                        lang.t('totalDue'),
                        style: const TextStyle(
                          color: Colors.white70,
                          fontSize: 14,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '\$${bills.totalDue.toStringAsFixed(2)}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 40,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          _chip(
                            '${bills.overdueBills.length} Overdue',
                            Colors.red.shade300,
                          ),
                          const SizedBox(width: 8),
                          _chip(
                            '${bills.upcomingBills.length} Upcoming',
                            Colors.amber.shade300,
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
          actions: [
            IconButton(
              icon: const Icon(Icons.refresh, color: Colors.white),
              onPressed: () {
                Provider.of<BillProvider>(context, listen: false).fetchBills();
                Provider.of<NotificationProvider>(
                  context,
                  listen: false,
                ).fetchNotifications();
              },
            ),
            Consumer<NotificationProvider>(
              builder: (ctx, np, _) => Stack(
                children: [
                  IconButton(
                    icon: const Icon(
                      Icons.notifications_outlined,
                      color: Colors.white,
                    ),
                    onPressed: () => Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => const NotificationScreen(),
                      ),
                    ),
                  ),
                  if (np.unreadCount > 0)
                    Positioned(
                      right: 12,
                      top: 12,
                      child: Container(
                        padding: const EdgeInsets.all(2),
                        decoration: BoxDecoration(
                          color: Colors.red,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        constraints: const BoxConstraints(
                          minWidth: 12,
                          minHeight: 12,
                        ),
                        child: Text(
                          '${np.unreadCount}',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 8,
                            fontWeight: FontWeight.bold,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ],
          title: bills.isLoading ? const SizedBox() : null,
          backgroundColor: const Color(0xFF4F46E5),
        ),

        if (overdue.isNotEmpty)
          SliverToBoxAdapter(
            child: Container(
              margin: const EdgeInsets.fromLTRB(16, 16, 16, 0),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.red.shade50,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: Colors.red.shade100),
              ),
              child: Row(
                children: [
                  const Icon(Icons.warning_amber_rounded, color: Colors.red),
                  const SizedBox(width: 10),
                  Text(
                    '${overdue.length} bill(s) are overdue!',
                    style: const TextStyle(
                      color: Colors.red,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          ),

        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  lang.t('upcoming'),
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 18,
                  ),
                ),
                TextButton(
                  onPressed: () => setState(() => _currentIndex = 1),
                  child: const Text(
                    'View All',
                    style: TextStyle(
                      color: Color(0xFF4F46E5),
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),

        SliverList(
          delegate: SliverChildBuilderDelegate((ctx, i) {
            final bill = upcoming[i];
            final meta = getCategoryMeta(
              context,
              bill['category'] ?? '',
              _categoryMeta,
            );
            return Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
              child: _billCard(ctx, lang, bill, meta),
            );
          }, childCount: upcoming.length),
        ),
        const SliverToBoxAdapter(child: SizedBox(height: 80)),
      ],
    );
  }

  Widget _buildBillsList(
    BuildContext context,
    LanguageProvider lang,
    BillProvider bills,
  ) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          lang.t('myBills'),
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        automaticallyImplyLeading: false,
        leading: IconButton(
          icon: const Icon(Icons.menu),
          onPressed: () => _advancedDrawerController.showDrawer(),
        ),
      ),
      body: bills.isLoading
          ? const Center(child: CircularProgressIndicator())
          : bills.bills.isEmpty
          ? Center(
              child: Text(
                lang.t('noBills'),
                style: TextStyle(color: Colors.grey.shade500),
              ),
            )
          : RefreshIndicator(
              onRefresh: () => bills.fetchBills(),
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: bills.bills.length,
                itemBuilder: (ctx, i) {
                  final bill = bills.bills[i];
                  final meta = getCategoryMeta(
                    context,
                    bill['category'] ?? '',
                    _categoryMeta,
                  );
                  return Dismissible(
                    key: Key(bill['_id']),
                    direction: DismissDirection.endToStart,
                    background: Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      decoration: BoxDecoration(
                        color: Colors.red.shade100,
                        borderRadius: BorderRadius.circular(16),
                      ),
                      alignment: Alignment.centerRight,
                      padding: const EdgeInsets.only(right: 20),
                      child: const Icon(Icons.delete, color: Colors.red),
                    ),
                    onDismissed: (_) => bills.deleteBill(bill['_id']),
                    child: GestureDetector(
                      onLongPress: () async {
                        final result = await Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => AddBillScreen(
                              existingBill: Map<String, dynamic>.from(bill),
                            ),
                          ),
                        );
                        if (result == true) bills.fetchBills();
                      },
                      child: Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: _billCard(ctx, lang, bill, meta),
                      ),
                    ),
                  );
                },
              ),
            ),
    );
  }

  Widget _buildAdvancedDrawer(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final lang = Provider.of<LanguageProvider>(context);
    final userName = auth.user != null && auth.user!['name'] != null
        ? auth.user!['name'] as String
        : lang.t('guest');
    final userEmail = auth.user != null && auth.user!['email'] != null
        ? auth.user!['email'] as String
        : '';

    return Drawer(
      child: Column(
        children: [
          DrawerHeader(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [Color(0xFF4F46E5), Color(0xFF6366F1)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Container(
                  width: 60,
                  height: 60,
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(18),
                  ),
                  child: const Icon(
                    Icons.person,
                    size: 36,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        userName,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        userEmail,
                        style: const TextStyle(
                          color: Colors.white70,
                          fontSize: 14,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          _drawerItem(
            icon: Icons.person_outline,
            title: lang.t('profile'),
            onTap: () => _openDrawerScreen(const ProfileScreen()),
          ),
          _drawerItem(
            icon: Icons.notifications_outlined,
            title: lang.t('notifications'),
            onTap: () => _openDrawerScreen(const NotificationScreen()),
          ),
          _drawerItem(
            icon: Icons.add_circle_outline,
            title: lang.t('addBill'),
            onTap: _openAddBillFromDrawer,
          ),
          _drawerItem(
            icon: Icons.settings_outlined,
            title: lang.t('settings'),
            onTap: () => _openDrawerScreen(const SettingsScreen()),
          ),
          const Spacer(),
          const Divider(height: 1),
          ListTile(
            leading: const Icon(Icons.logout, color: Color(0xFF4F46E5)),
            title: Text(
              lang.t('logout'),
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            onTap: () async {
              await Provider.of<AuthProvider>(context, listen: false).logout();
              Navigator.pushReplacementNamed(context, '/login');
            },
          ),
          const SizedBox(height: 12),
        ],
      ),
    );
  }

  Widget _drawerItem({
    required IconData icon,
    required String title,
    required VoidCallback onTap,
    bool selected = false,
  }) {
    return ListTile(
      leading: Icon(
        icon,
        color: selected ? const Color(0xFF4F46E5) : Colors.grey.shade600,
      ),
      title: Text(
        title,
        style: TextStyle(
          color: selected ? const Color(0xFF4F46E5) : Colors.black87,
          fontWeight: selected ? FontWeight.bold : FontWeight.w500,
        ),
      ),
      trailing: selected
          ? const Icon(Icons.chevron_right, color: Color(0xFF4F46E5))
          : null,
      onTap: onTap,
    );
  }

  void _onDrawerItemTap(int index) {
    setState(() {
      _currentIndex = index;
    });
    _advancedDrawerController.hideDrawer();
  }

  void _openDrawerScreen(Widget screen) {
    _advancedDrawerController.hideDrawer();
    Future.delayed(const Duration(milliseconds: 220), () {
      if (!mounted) return;
      Navigator.push(context, MaterialPageRoute(builder: (_) => screen));
    });
  }

  Future<void> _openAddBillFromDrawer() async {
    _advancedDrawerController.hideDrawer();
    await Future.delayed(const Duration(milliseconds: 220));
    if (!mounted) return;
    final result = await Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const AddBillScreen()),
    );
    if (result == true && mounted) {
      setState(() {});
    }
  }

  Widget _billCard(
    BuildContext context,
    LanguageProvider lang,
    dynamic bill,
    Map meta,
  ) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: (meta['color'] as Color).withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child:
                  meta['image'] != null && meta['image'].toString().isNotEmpty
                  ? Image.network(
                      'https://full-stack-system-1ex6.onrender.com${meta['image']}',
                      fit: BoxFit.cover,
                      loadingBuilder: (context, child, loadingProgress) {
                        if (loadingProgress == null) return child;
                        return Center(
                          child: getCategoryIcon(
                            meta['icon'] as String? ?? '📋',
                            color: (meta['color'] as Color),
                            size: 24,
                          ),
                        );
                      },
                      errorBuilder: (_, __, ___) => Center(
                        child: getCategoryIcon(
                          meta['icon'] as String? ?? '📋',
                          color: (meta['color'] as Color),
                          size: 24,
                        ),
                      ),
                    )
                  : Center(
                      child: getCategoryIcon(
                        meta['icon'] as String? ?? '📋',
                        color: (meta['color'] as Color),
                        size: 24,
                      ),
                    ),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  bill['title'] ?? '',
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 15,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  _daysLeft(bill['dueDate']),
                  style: TextStyle(
                    fontSize: 12,
                    color: bill['status'] == 'overdue'
                        ? Colors.red
                        : Colors.grey.shade500,
                  ),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                '\$${bill['amount']}',
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
              const SizedBox(height: 5),
              if (bill['status'] != 'paid')
                GestureDetector(
                  onTap: () async {
                    final result = await Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => PaymentScreen(
                          bill: Map<String, dynamic>.from(bill),
                        ),
                      ),
                    );
                    if (result == true) {
                      Provider.of<BillProvider>(
                        context,
                        listen: false,
                      ).fetchBills();
                    }
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 5,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFF4F46E5),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      lang.t('payNow'),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                )
              else
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 5,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.green.shade100,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    lang.t('paid'),
                    style: TextStyle(
                      color: Colors.green.shade700,
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              const SizedBox(height: 5),
              _editBillButton(context, bill),
            ],
          ),
        ],
      ),
    );
  }

  Widget _editBillButton(BuildContext context, dynamic bill) {
    return GestureDetector(
      onTap: () async {
        final result = await Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) =>
                AddBillScreen(existingBill: Map<String, dynamic>.from(bill)),
          ),
        );
        if (result == true) {
          Provider.of<BillProvider>(context, listen: false).fetchBills();
        }
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: Colors.grey.shade100,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.grey.shade300),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.edit_outlined, size: 13, color: Colors.grey.shade600),
            const SizedBox(width: 4),
            Text(
              'Edit',
              style: TextStyle(
                fontSize: 11,
                color: Colors.grey.shade700,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _chip(String text, Color color) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
    decoration: BoxDecoration(
      color: color.withOpacity(0.2),
      borderRadius: BorderRadius.circular(20),
    ),
    child: Text(
      text,
      style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.bold),
    ),
  );
}
