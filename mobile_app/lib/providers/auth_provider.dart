import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import 'package:flutter/foundation.dart';
import '../services/notification_service.dart';

class AuthProvider with ChangeNotifier {
  final _storage = const FlutterSecureStorage();
  // Use Render deployment URL for online usage; fall back to localhost for local dev
  final String _baseUrl = kIsWeb
      ? 'https://full-stack-system-1ex6.onrender.com/api'
      : 'https://full-stack-system-1ex6.onrender.com/api';

  String? _token;
  Map<String, dynamic>? _user;
  bool _isLoading = false;

  bool get isAuthenticated => _token != null;
  bool get isLoading => _isLoading;
  String? get token => _token;
  Map<String, dynamic>? get user => _user;

  Map<String, dynamic> _decodeBody(http.Response response) {
    final body = response.body.trim();
    if (body.isEmpty) {
      return {'message': _fallbackMessage(response.statusCode)};
    }

    try {
      final decoded = json.decode(body);
      if (decoded is Map) {
        return decoded.map((key, value) => MapEntry(key.toString(), value));
      }
      return {'message': decoded.toString()};
    } catch (_) {
      return {'message': _fallbackMessage(response.statusCode)};
    }
  }

  String _fallbackMessage(int statusCode) {
    if (statusCode == 502 || statusCode == 503 || statusCode == 504) {
      return 'OTP email service is temporarily unavailable. Please try again after the email settings are updated.';
    }
    if (statusCode >= 500) {
      return 'Server error. Please try again shortly.';
    }
    return 'Request failed (HTTP $statusCode).';
  }

  Future<dynamic> login(
    String email,
    String password, {
    String? fcmToken,
  }) async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'email': email,
          'password': password,
          if (fcmToken != null) 'fcmToken': fcmToken,
        }),
      );

      final data = _decodeBody(response);
      if (response.statusCode == 200) {
        if (data['requiresOtp'] == true) {
          _isLoading = false;
          notifyListeners();
          return data;
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
        return null;
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

  Future<Map<String, dynamic>?> register(
    String name,
    String email,
    String password,
    String phone, {
    String? fcmToken,
  }) async {
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
          if (fcmToken != null) 'fcmToken': fcmToken,
        }),
      );

      final data = _decodeBody(response);
      _isLoading = false;
      notifyListeners();

      if (response.statusCode == 200) {
        // OTP verification required
        return data; // returns {'requiresOtp': true, 'email': email}
      } else if (response.statusCode == 201) {
        // Direct registration (fallback)
        _token = data['token'];
        _user = data;
        if (_token != null) {
          await _storage.write(key: 'jwt', value: _token!);
          await _storage.write(key: 'user', value: json.encode(data));
          NotificationService.updateTokenOnServer();
        }
        notifyListeners();
        return null;
      } else {
        throw Exception(data['message'] ?? 'Registration failed');
      }
    } catch (e) {
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }

  Future<void> verifyRegisterOtp(String email, String otp) async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/auth/verify-register-otp'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'email': email, 'otp': otp}),
      );

      final data = _decodeBody(response);
      if (response.statusCode == 201 || response.statusCode == 200) {
        _token = data['token'];
        _user = data;
        if (_token != null) {
          await _storage.write(key: 'jwt', value: _token!);
          await _storage.write(key: 'user', value: json.encode(data));
          NotificationService.updateTokenOnServer();
        }
        notifyListeners();
      } else {
        throw Exception(data['message'] ?? 'Verification failed');
      }
    } catch (e) {
      _isLoading = false;
      notifyListeners();
      rethrow;
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<Map<String, dynamic>?> resendRegisterOtp(String email, {String? fcmToken}) async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/auth/resend-register-otp'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'email': email,
          if (fcmToken != null) 'fcmToken': fcmToken,
        }),
      );

      final data = _decodeBody(response);
      _isLoading = false;
      notifyListeners();

      if (response.statusCode != 200) {
        throw Exception(data['message'] ?? 'Failed to resend OTP');
      }
      return data;
    } catch (e) {
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }

  Future<void> verifyLoginOtp(String email, String otp) async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/auth/verify-login-otp'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'email': email, 'otp': otp}),
      );

      final data = _decodeBody(response);
      if (response.statusCode == 200 || response.statusCode == 201) {
        _token = data['token'];
        _user = data;
        if (_token != null) {
          await _storage.write(key: 'jwt', value: _token!);
          await _storage.write(key: 'user', value: json.encode(data));
          NotificationService.updateTokenOnServer();
        }
        notifyListeners();
      } else {
        throw Exception(data['message'] ?? 'Verification failed');
      }
    } catch (e) {
      _isLoading = false;
      notifyListeners();
      rethrow;
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<Map<String, dynamic>?> resendLoginOtp(String email, {String? fcmToken}) async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/auth/resend-login-otp'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'email': email,
          if (fcmToken != null) 'fcmToken': fcmToken,
        }),
      );

      final data = _decodeBody(response);
      _isLoading = false;
      notifyListeners();

      if (response.statusCode != 200) {
        throw Exception(data['message'] ?? 'Failed to resend OTP');
      }
      return data;
    } catch (e) {
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }

  Future<Map<String, dynamic>> forgotPassword(String email) async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/auth/forgot-password'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'email': email}),
      );

      final data = _decodeBody(response);
      _isLoading = false;
      notifyListeners();

      if (response.statusCode == 200) {
        return data; // contains success, message, email, debugOtp
      } else {
        throw Exception(data['message'] ?? 'Failed to request password reset');
      }
    } catch (e) {
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
  }

  Future<void> resetPassword(
    String email,
    String otp,
    String newPassword,
  ) async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/auth/reset-password'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'email': email,
          'otp': otp,
          'newPassword': newPassword,
        }),
      );

      final data = _decodeBody(response);
      _isLoading = false;
      notifyListeners();

      if (response.statusCode != 200) {
        throw Exception(data['message'] ?? 'Failed to reset password');
      }
    } catch (e) {
      _isLoading = false;
      notifyListeners();
      rethrow;
    }
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

  // Cusboonaysii xogta isticmaalaha ee gudaha app-ka iyo kaydinta
  Future<void> updateLocalUser(Map<String, dynamic> userData) async {
    _user = userData;
    await _storage.write(key: 'user', value: json.encode(userData));
    notifyListeners();
  }
}
