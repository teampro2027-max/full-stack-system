import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/language_provider.dart';
import '../services/api_service.dart';
import '../utils/download_helper.dart';
import '../utils/category_helpers.dart';

class ReportsScreen extends StatefulWidget {
  const ReportsScreen({Key? key}) : super(key: key);

  @override
  _ReportsScreenState createState() => _ReportsScreenState();
}

class _ReportsScreenState extends State<ReportsScreen> {
  final now = DateTime.now();
  late int _selectedYear;
  late int _selectedMonth;
  bool _loading = false;
  Map<String, dynamic>? _reportData;
  String _reportType = 'Monthly'; // 'Monthly' or 'Annual'

  // Phone search state
  final TextEditingController _phoneController = TextEditingController();
  bool _searchingPhone = false;
  Map<String, dynamic>? _phoneReportData;

  // User activity state
  List<dynamic> _userActivityList = [];
  bool _loadingUserActivity = false;
  final TextEditingController _userSearchController = TextEditingController();
  String _userQuery = '';

  final List<String> _months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  @override
  void initState() {
    super.initState();
    _selectedYear = now.year;
    _selectedMonth = now.month;
    _fetchReport();

    Future.microtask(() {
      final auth = Provider.of<AuthProvider>(context, listen: false);
      if (auth.user?['role'] == 'admin') {
        _fetchUserActivity();
      }
    });
  }

  Future<void> _fetchUserActivity() async {
    setState(() => _loadingUserActivity = true);
    try {
      final data = await ApiService.get('/reports/users-activity');
      if (mounted) {
        setState(() {
          _userActivityList = data['users'] ?? [];
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to load user activity report')));
      }
    } finally {
      if (mounted) setState(() => _loadingUserActivity = false);
    }
  }

  Future<void> _fetchReport() async {
    setState(() => _loading = true);
    try {
      final monthParam = _reportType == 'Annual' ? '' : '&month=$_selectedMonth';
      final data = await ApiService.get('/reports/monthly?year=$_selectedYear$monthParam');
      setState(() => _reportData = data);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to load report summary')));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _searchPhone() async {
    final phone = _phoneController.text.trim();
    if (phone.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Fadlan gali nambar')));
      return;
    }

    setState(() => _searchingPhone = true);
    try {
      final data = await ApiService.get('/reports/phone/$phone');
      setState(() => _phoneReportData = data);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Baaritaanka waa ku fashilmay: $e')));
    } finally {
      if (mounted) setState(() => _searchingPhone = false);
    }
  }

  Future<void> _exportPdf() async {
    try {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Generating PDF Report...'), duration: Duration(seconds: 1)));

      final monthParam = _reportType == 'Annual' ? '' : '&month=$_selectedMonth';
      final data = await ApiService.getBytes('/reports/export-pdf?year=$_selectedYear$monthParam');
      await DownloadHelper.downloadFile(data, 'report-$_selectedYear-${_reportType == 'Annual' ? 'Annual' : _selectedMonth}.pdf');
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Export failed: $e')));
    }
  }

  Future<void> _exportPhonePdf() async {
    final number = _phoneReportData?['phoneNumber'];
    if (number == null) return;
    try {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Generating Phone Report PDF...'), duration: Duration(seconds: 1)));

      final data = await ApiService.getBytes('/reports/phone/$number/export');
      await DownloadHelper.downloadFile(data, 'phone-report-$number.pdf');
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Export failed: $e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    final lang = Provider.of<LanguageProvider>(context);
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final isAdmin = auth.user?['role'] == 'admin';

    return DefaultTabController(
      length: isAdmin ? 3 : 2,
      child: Scaffold(
        appBar: AppBar(
          automaticallyImplyLeading: false,
          title: Text(lang.t('reports'), style: const TextStyle(fontWeight: FontWeight.bold)),
          bottom: TabBar(
            isScrollable: true,
            tabs: [
              const Tab(text: 'Warbixin Guud', icon: Icon(Icons.analytics_outlined)),
              const Tab(text: 'Baar Nambar', icon: Icon(Icons.phone_android)),
              if (isAdmin) const Tab(text: 'Macaamiisha (Users)', icon: Icon(Icons.people_outline)),
            ],
            indicatorColor: const Color(0xFF4F46E5),
            labelStyle: const TextStyle(fontWeight: FontWeight.bold),
          ),
        ),
        body: TabBarView(
          children: [
            // General Reports Tab
            _buildGeneralTab(),
            // Phone Search Tab
            _buildPhoneSearchTab(),
            if (isAdmin) _buildUserActivityTab(),
          ],
        ),
      ),
    );
  }

  Widget _buildUserActivityTab() {
    final filtered = _userActivityList.where((u) {
      final name = (u['name'] ?? '').toString().toLowerCase();
      final email = (u['email'] ?? '').toString().toLowerCase();
      final phone = (u['phone'] ?? '').toString().toLowerCase();
      final q = _userQuery.toLowerCase();
      return name.contains(q) || email.contains(q) || phone.contains(q);
    }).toList();

    return Column(
      children: [
        // Search bar
        Padding(
          padding: const EdgeInsets.all(16.0),
          child: TextField(
            controller: _userSearchController,
            onChanged: (val) => setState(() => _userQuery = val),
            decoration: InputDecoration(
              hintText: 'Raadi magac, email ama nambar...',
              prefixIcon: const Icon(Icons.search),
              contentPadding: const EdgeInsets.symmetric(vertical: 0, horizontal: 16),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ),
        ),
        
        Expanded(
          child: _loadingUserActivity
              ? const Center(child: CircularProgressIndicator())
              : filtered.isEmpty
                  ? const Center(child: Text('Ma jiraan isticmaalayaal la helay.'))
                  : RefreshIndicator(
                      onRefresh: _fetchUserActivity,
                      child: ListView.builder(
                        itemCount: filtered.length,
                        itemBuilder: (ctx, i) {
                          final u = filtered[i];
                          final status = u['status'] ?? 'active';
                          final daysActive = u['daysActive'] ?? 0;
                          final totalBills = u['totalBills'] ?? 0;
                          final paidBills = u['paidBills'] ?? 0;

                          return Card(
                            margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                            elevation: 0,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                              side: BorderSide(color: Colors.grey.shade100),
                            ),
                            child: Padding(
                              padding: const EdgeInsets.all(16.0),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Expanded(
                                        child: Text(
                                          u['name'] ?? '—',
                                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                                        ),
                                      ),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                        decoration: BoxDecoration(
                                          color: status == 'active'
                                              ? Colors.green.shade50
                                              : status == 'suspended'
                                                  ? Colors.red.shade50
                                                  : Colors.amber.shade50,
                                          borderRadius: BorderRadius.circular(8),
                                        ),
                                        child: Text(
                                          status.toUpperCase(),
                                          style: TextStyle(
                                            color: status == 'active'
                                                ? Colors.green
                                                : status == 'suspended'
                                                    ? Colors.red
                                                    : Colors.amber,
                                            fontWeight: FontWeight.bold,
                                            fontSize: 10,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    '${u['email'] ?? ''} • ${u['phone'] ?? ''}',
                                    style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
                                  ),
                                  const Divider(height: 24),
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            'Waqtiga Diiwangelinta',
                                            style: TextStyle(color: Colors.grey.shade400, fontSize: 11),
                                          ),
                                          const SizedBox(height: 2),
                                          Text(
                                            'Days: $daysActive ${daysActive == 1 ? 'maalin' : 'maalmood'}',
                                            style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                                          ),
                                        ],
                                      ),
                                      Column(
                                        crossAxisAlignment: CrossAxisAlignment.end,
                                        children: [
                                          Text(
                                            'Biilal & Bixis',
                                            style: TextStyle(color: Colors.grey.shade400, fontSize: 11),
                                          ),
                                          const SizedBox(height: 2),
                                          Text(
                                            'Total: $totalBills | Paid: $paidBills',
                                            style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: Colors.indigo),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ),
        ),
      ],
    );
  }

  Widget _buildGeneralTab() {
    return Column(
      children: [
        // Filter Section
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            border: Border(bottom: BorderSide(color: Colors.grey.shade200)),
          ),
          child: LayoutBuilder(
            builder: (context, constraints) {
              final useColumn = constraints.maxWidth < 560;

              final typeField = DropdownButtonFormField<String>(
                isExpanded: true,
                value: _reportType,
                decoration: InputDecoration(
                  labelText: 'Type',
                  contentPadding: const EdgeInsets.symmetric(horizontal: 12),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                ),
                items: ['Monthly', 'Annual'].map((t) => DropdownMenuItem(
                  value: t,
                  child: Text(t, style: const TextStyle(fontSize: 14), overflow: TextOverflow.ellipsis),
                )).toList(),
                onChanged: (v) {
                  if (v != null) {
                    setState(() => _reportType = v);
                    _fetchReport();
                  }
                },
              );

              final yearField = DropdownButtonFormField<int>(
                isExpanded: true,
                value: _selectedYear,
                decoration: InputDecoration(
                  labelText: 'Sanadka',
                  contentPadding: const EdgeInsets.symmetric(horizontal: 12),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                ),
                items: [2023, 2024, 2025, 2026].map((y) => DropdownMenuItem(
                  value: y,
                  child: Text(y.toString(), style: const TextStyle(fontSize: 14), overflow: TextOverflow.ellipsis),
                )).toList(),
                onChanged: (v) {
                  if (v != null) {
                    setState(() => _selectedYear = v);
                    _fetchReport();
                  }
                },
              );

              final monthField = DropdownButtonFormField<int>(
                isExpanded: true,
                value: _selectedMonth,
                decoration: InputDecoration(
                  labelText: 'Bisha',
                  contentPadding: const EdgeInsets.symmetric(horizontal: 12),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                ),
                items: List.generate(12, (i) => DropdownMenuItem(
                  value: i + 1,
                  child: Text(_months[i], style: const TextStyle(fontSize: 14), overflow: TextOverflow.ellipsis),
                )),
                onChanged: (v) {
                  if (v != null) {
                    setState(() => _selectedMonth = v);
                    _fetchReport();
                  }
                },
              );

              if (useColumn) {
                return Column(
                  children: [
                    typeField,
                    const SizedBox(height: 8),
                    yearField,
                    if (_reportType == 'Monthly') ...[
                      const SizedBox(height: 8),
                      monthField,
                    ],
                  ],
                );
              }

              return Row(
                children: [
                  Expanded(flex: 2, child: typeField),
                  const SizedBox(width: 8),
                  Expanded(flex: 2, child: yearField),
                  if (_reportType == 'Monthly') ...[
                    const SizedBox(width: 8),
                    Expanded(flex: 3, child: monthField),
                  ],
                ],
              );
            },
          ),
        ),

        Expanded(
          child: _loading 
            ? const Center(child: CircularProgressIndicator())
            : _reportData == null 
              ? const Center(child: Text('Ma jirto xog warbixin ah'))
              : SingleChildScrollView(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      _buildSummaryCard(_reportData!),
                      const SizedBox(height: 24),
                      _buildSectionTitle('Expense Distribution'),
                      const SizedBox(height: 12),
                      _buildCategoryBreakdown(_reportData!['byCategory']),
                      const SizedBox(height: 32),
                      _buildSectionTitle('Dhammaan Lacagaha (All Transactions)'),
                      const SizedBox(height: 12),
                      _buildAllTransactionsList(_reportData!['payments'] as List?),
                      const SizedBox(height: 32),
                      ElevatedButton.icon(
                        onPressed: _exportPdf,
                        icon: const Icon(Icons.picture_as_pdf, color: Colors.white),
                        label: const Text('Export Full PDF Report', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF10B981),
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        ),
                      ),
                    ],
                  ),
                ),
        ),
      ],
    );
  }

  Widget _buildPhoneSearchTab() {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          TextField(
            controller: _phoneController,
            keyboardType: TextInputType.phone,
            decoration: InputDecoration(
              hintText: 'Gali nambarka taleefanka (tusaale: 061XXXXX)',
              prefixIcon: const Icon(Icons.phone),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(15)),
              suffixIcon: IconButton(
                icon: const Icon(Icons.search),
                onPressed: _searchPhone,
              ),
            ),
            onSubmitted: (_) => _searchPhone(),
          ),
          const SizedBox(height: 20),
          Expanded(
            child: _searchingPhone
                ? const Center(child: CircularProgressIndicator())
                : _phoneReportData == null
                    ? _buildSearchPlaceholder()
                    : _buildPhoneReportContent(),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchPlaceholder() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(Icons.search, size: 80, color: Colors.grey.shade300),
        const SizedBox(height: 16),
        Text('Raadi nambar si aad u aragto warbixintiisa', style: TextStyle(color: Colors.grey.shade600, fontSize: 16)),
      ],
    );
  }

  Widget _buildPhoneReportContent() {
    final data = _phoneReportData!;
    final payments = data['payments'] as List;

    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Summary Card for Phone
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF10B981), Color(0xFF059669)],
                begin: Alignment.topLeft, end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Column(
              children: [
                Text('Warbixinta: ${data['phoneNumber']}', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                const SizedBox(height: 15),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _summaryItem('Wareejin', '${data['totalTransfers']}', Colors.white),
                    Container(width: 1, height: 30, color: Colors.white24),
                    _summaryItem('Lacagta', '\$${data['totalAmount']}', Colors.white),
                    Container(width: 1, height: 30, color: Colors.white24),
                    _summaryItem('Success', '${data['successCount']}', Colors.white),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          ElevatedButton.icon(
            onPressed: _exportPhonePdf,
            icon: const Icon(Icons.picture_as_pdf, color: Colors.white),
            label: const Text('Download Phone Report (PDF)', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF10B981),
              minimumSize: const Size(double.infinity, 50),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ),
          const SizedBox(height: 24),
          const Text('Taariikhda Wareejinta', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          if (payments.isEmpty)
            const Text('Nambarkaan wax wareejin ah lagama helin.')
          else
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: payments.length,
              itemBuilder: (context, index) {
                final p = payments[index];
                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  child: ListTile(
                    leading: CircleAvatar(
                      backgroundColor: p['status'] == 'success' ? Colors.green.shade50 : Colors.red.shade50,
                      child: Icon(
                        p['status'] == 'success' ? Icons.check : Icons.close,
                        color: p['status'] == 'success' ? Colors.green : Colors.red,
                        size: 18,
                      ),
                    ),
                    title: Text(p['billId']?['title'] ?? 'Payment', style: const TextStyle(fontWeight: FontWeight.bold)),
                    subtitle: Text(p['transactionId'] ?? 'No Transaction ID'),
                    trailing: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text('\$${p['amount']}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                        Text(p['status'].toString().toUpperCase(), 
                          style: TextStyle(fontSize: 10, color: p['status'] == 'success' ? Colors.green : Colors.red, fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ),
                );
              },
            ),
        ],
      ),
    );
  }

  Widget _buildSummaryCard(Map<String, dynamic> data) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF4F46E5), Color(0xFF6366F1)],
          begin: Alignment.topLeft, end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [BoxShadow(color: Colors.indigo.withOpacity(0.3), blurRadius: 15)],
      ),
      child: Column(
        children: [
          const Text('Total Spending', style: TextStyle(color: Colors.white70, fontSize: 13)),
          Text('\$${data['totalDue']}', style: const TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.bold)),
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _summaryItem('Paid', '\$${data['totalPaid']}', Colors.white),
              Container(width: 1, height: 30, color: Colors.white24),
              _summaryItem('Outstanding', '\$${data['outstanding']}', Colors.white),
              Container(width: 1, height: 30, color: Colors.white24),
              _summaryItem('Bills', '${data['totalBills']}', Colors.white),
            ],
          ),
        ],
      ),
    );
  }

  Widget _summaryItem(String label, String value, Color color) {
    return Column(
      children: [
        Text(label, style: TextStyle(color: color.withOpacity(0.7), fontSize: 11)),
        const SizedBox(height: 4),
        Text(value, style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 16)),
      ],
    );
  }

  Widget _buildSectionTitle(String title) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Expanded(child: Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF1E293B)))),
        const SizedBox(width: 8),
        Text('Click to view details', style: TextStyle(fontSize: 11, color: Colors.grey.shade500, fontStyle: FontStyle.italic)),
      ],
    );
  }

  void _showCategoryDetails(String category) {
    if (_reportData == null || _reportData!['payments'] == null) return;
    
    final payments = (_reportData!['payments'] as List)
        .where((p) => p['billId'] != null && p['billId'] is Map && p['billId']['category'] == category)
        .toList();
    
    final meta = getCategoryMeta(context, category, const {});
    final iconColor = meta['color'] as Color? ?? Colors.indigo;
    final categoryLabel = (meta['name'] as String? ?? category).replaceAll('_', ' ').toUpperCase();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.75,
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(25)),
        ),
        child: Column(
          children: [
            const SizedBox(height: 12),
            Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(2))),
            const SizedBox(height: 20),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(color: iconColor.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
                    child: getCategoryIcon(
                      meta['icon'] as String? ?? '📋',
                      color: iconColor,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 15),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('$categoryLabel Details', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                        Text('Transaction history for this category', style: TextStyle(color: Colors.grey.shade600, fontSize: 13)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const Divider(height: 30),
            Expanded(
              child: payments.isEmpty
                  ? Center(child: Text('No $categoryLabel payments found in this month.'))
                  : ListView.builder(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      itemCount: payments.length,
                      itemBuilder: (context, index) {
                        final p = payments[index];
                        final paidDate = DateTime.parse(p['paidDate']);
                        final dateStr = "${paidDate.day}/${paidDate.month}/${paidDate.year}";
                        
                        return Container(
                          margin: const EdgeInsets.only(bottom: 16),
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: Colors.grey.shade50,
                            borderRadius: BorderRadius.circular(15),
                            border: Border.all(color: Colors.grey.shade200),
                          ),
                          child: Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      (p['billId'] is Map) ? p['billId']['title'] : 'Direct Payment', 
                                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)
                                    ),
                                    const SizedBox(height: 4),
                                    Text(dateStr, style: TextStyle(color: Colors.grey.shade600, fontSize: 12)),
                                    const SizedBox(height: 4),
                                    Row(
                                      children: [
                                        const Icon(Icons.phone_android, size: 12, color: Colors.grey),
                                        const SizedBox(width: 4),
                                        Text('Sent to: ${p['phoneNumber'] ?? 'N/A'}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500)),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                              Text('\$${p['amount']}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.indigo)),
                            ],
                          ),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCategoryBreakdown(Map<String, dynamic>? byCategory) {
    if (byCategory == null || byCategory.isEmpty) {
      return const Text('No expenses grouped by category yet.');
    }

    return Column(
      children: byCategory.entries.map((e) {
        final meta = getCategoryMeta(context, e.key, const {});
        final iconColor = meta['color'] as Color? ?? Colors.indigo;
        final categoryLabel = (meta['name'] as String? ?? e.key).replaceAll('_', ' ').toUpperCase();

        return InkWell(
          onTap: () => _showCategoryDetails(e.key),
          borderRadius: BorderRadius.circular(12),
          child: Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.grey.shade100),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(color: iconColor.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
                  child: getCategoryIcon(
                    meta['icon'] as String? ?? '📋',
                    color: iconColor,
                    size: 18,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(child: Text(categoryLabel, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13))),
                Text('\$${e.value}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Color(0xFF4F46E5))),
                const SizedBox(width: 8),
                const Icon(Icons.chevron_right, size: 16, color: Colors.grey),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildAllTransactionsList(List? payments) {
    if (payments == null || payments.isEmpty) {
      return const Text('Ma jiraan lacago la bixiyey bishaan.');
    }

    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: payments.length,
      itemBuilder: (context, index) {
        final p = payments[index];
        final paidDateStr = p['paidDate'] ?? p['createdAt'];
        if (paidDateStr == null) return const SizedBox();
        
        String dateStr;
        try {
          final paidDate = DateTime.parse(paidDateStr);
          dateStr = "${paidDate.day}/${paidDate.month}/${paidDate.year}";
        } catch (e) {
          dateStr = "N/A";
        }

        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey.shade100),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: Colors.indigo.shade50, borderRadius: BorderRadius.circular(8)),
                child: const Icon(Icons.payment, size: 18, color: Colors.indigo),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      (p['billId'] is Map) ? p['billId']['title'] : 'Direct Payment',
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                    ),
                    Text('$dateStr â€¢ ${p['phoneNumber'] ?? 'No Number'}', style: TextStyle(color: Colors.grey.shade500, fontSize: 11)),
                  ],
                ),
              ),
              Text('\$${p['amount']}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Color(0xFF4F46E5))),
            ],
          ),
        );
      },
    );
  }
}
