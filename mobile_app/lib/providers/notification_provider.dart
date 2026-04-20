import 'package:flutter/material.dart';
import '../services/api_service.dart';

class NotificationProvider with ChangeNotifier {
  List<dynamic> _notifications = [];
  bool _isLoading = false;

  List<dynamic> get notifications => _notifications;
  bool get isLoading => _isLoading;
  int get unreadCount => _notifications.where((n) => n['status'] == 'unread').length;

  Future<void> fetchNotifications() async {
    _isLoading = true;
    notifyListeners();

    try {
      _notifications = await ApiService.get('/notifications');
    } catch (e) {
      _notifications = [];
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> markAsRead(String id) async {
    try {
      await ApiService.put('/notifications/$id', {});
      final index = _notifications.indexWhere((n) => n['_id'] == id);
      if (index != -1) {
        _notifications[index]['status'] = 'read';
        notifyListeners();
      }
    } catch (e) {
      // Handle error
    }
  }
}
