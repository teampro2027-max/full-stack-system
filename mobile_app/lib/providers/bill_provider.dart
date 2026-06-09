import 'package:flutter/material.dart';
import '../services/api_service.dart';

class BillProvider with ChangeNotifier {
  List<dynamic> _bills = [];
  List<dynamic> _categories = [];
  bool _isLoading = false;

  List<dynamic> get bills => _bills;
  List<dynamic> get categories => _categories;
  bool get isLoading => _isLoading;

  List<dynamic> get upcomingBills => _bills
      .where((b) => b['status'] == 'unpaid')
      .toList()
    ..sort((a, b) => DateTime.parse(a['dueDate']).compareTo(DateTime.parse(b['dueDate'])));

  List<dynamic> get overdueBills => _bills.where((b) => b['status'] == 'overdue').toList();
  
  double get totalDue => _bills
      .where((b) => b['status'] != 'paid')
      .fold(0.0, (sum, b) => sum + (b['amount'] as num).toDouble());

  Future<void> fetchBills() async {
    _isLoading = true;
    notifyListeners();
    try {
      // Fetch bills and categories separately to avoid type casting issues
      final billsResult = await ApiService.get('/bills');
      _bills = (billsResult is List) ? List<dynamic>.from(billsResult) : [];
    } catch (e) {
      _bills = [];
    }
    // Fetch categories separately (no auth required)
    try {
      final catResult = await ApiService.get('/categories');
      final rawList = catResult is Map ? (catResult['categories'] ?? []) : [];
      _categories = (rawList as List<dynamic>)
          .where((c) => c['active'] == true)
          .toList();
    } catch (e) {
      _categories = [];
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<void> addBill(Map<String, dynamic> data) async {
    try {
      final bill = await ApiService.post('/bills', data);
      _bills.insert(0, bill);
      notifyListeners();
    } catch (e) {
      rethrow;
    }
  }

  Future<void> updateBill(String id, Map<String, dynamic> data) async {
    try {
      await ApiService.put('/bills/$id', data);
    } catch (_) {}
    final idx = _bills.indexWhere((b) => b['_id'] == id);
    if (idx != -1) { _bills[idx] = {..._bills[idx], ...data}; notifyListeners(); }
  }

  Future<void> deleteBill(String id) async {
    try { await ApiService.delete('/bills/$id'); } catch (_) {}
    _bills.removeWhere((b) => b['_id'] == id);
    notifyListeners();
  }
}
