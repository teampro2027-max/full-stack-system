import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import 'package:flutter/foundation.dart';
import '../services/notification_service.dart';

class AuthProvider with ChangeNotifier {
  final _storage = const FlutterSecureStorage();
  final String _baseUrl = kIsWeb ? 'http://localhost:5000/api' : 'http://10.0.2.2:5000/api';

  String? _token;
  Map<String, dynamic>? _user;
  bool _isLoading = false;

  bool get isAuthenticated => _token != null;
  bool get isLoading => _isLoading;
  String? get token => _token;
  Map<String, dynamic>? get user => _user;

  Future<dynamic> login(String email, String password) async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'email': email, 'password': password}),
      );

      final data = json.decode(response.body);
      if (response.statusCode == 200) {
        if (data['requiresMfa'] == true) {
          _isLoading = false;
          notifyListeners();
          return data; // Return to UI for MFA code entry
        }
        _token = data['token'];
        _user = data;
        if (_token != null) {
            await _storage.write(key: 'jwt', value: _token!);
            await _storage.write(key: 'user', value: json.encode(data));
            // Update FCM token on server after login
            NotificationService.updateTokenOnServer();
        }
        notifyListeners();
      } else {
        throw Exception(data['message'] ?? 'Login failed');
      }
    } catch (e) {
      _isLoading = false;
      notifyListeners();
      rethrow;
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> loginWithMfa(String email, String password, String token) async {
    _isLoading = true;
    notifyListeners();
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'email': email, 'password': password, 'mfaToken': token}),
      );
      final data = json.decode(response.body);
      if (response.statusCode == 200) {
        _token = data['token'];
        _user = data;
        await _storage.write(key: 'jwt', value: _token!);
        await _storage.write(key: 'user', value: json.encode(data));
        // Update FCM token on server after MFA login
        NotificationService.updateTokenOnServer();
        notifyListeners();
      } else {
        throw Exception(data['message'] ?? 'MFA Verification failed');
      }
    } catch (e) {
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> register(String name, String email, String password, String phone) async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/auth/register'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'name': name,
          'email': email,
          'password': password,
          'phone': phone,
        }),
      );

      final data = json.decode(response.body);
      if (response.statusCode == 201) {
        _token = data['token'];
        _user = data;
        if (_token != null) {
          await _storage.write(key: 'jwt', value: _token!);
          await _storage.write(key: 'user', value: json.encode(data));
          // Update FCM token on server after registration
          NotificationService.updateTokenOnServer();
        }
        notifyListeners();
      } else {
        throw Exception(data['message'] ?? 'Registration failed');
      }
    } catch (e) {
      _isLoading = false;
      notifyListeners();
      rethrow;
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> checkAuth() async {
    _token = await _storage.read(key: 'jwt');
    final userStr = await _storage.read(key: 'user');
    if (userStr != null) {
      _user = json.decode(userStr);
      // Ensure token is fresh on the server if already logged in
      NotificationService.updateTokenOnServer();
    }
    notifyListeners();
  }

  Future<void> logout() async {
    _token = null;
    _user = null;
    await _storage.delete(key: 'jwt');
    await _storage.delete(key: 'user');
    notifyListeners();
  }
}
