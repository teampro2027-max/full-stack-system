import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;

class ApiService {
  // OFFLINE MODE: isticmaal 10.0.2.2 (Android emulator) ama localhost (web/iOS)
  // ONLINE MODE: use the Render deployment URL below
  static const String baseUrl =
      'https://full-stack-system-1ex6.onrender.com/api';
  static const _storage = FlutterSecureStorage();

  static Future<String?> _getToken() async {
    return await _storage.read(key: 'jwt');
  }

  static Future<Map<String, String>> _headers() async {
    final token = await _getToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  static dynamic _decodeBody(http.Response res) {
    final body = res.body.trim();
    if (body.isEmpty) return {'message': _fallbackMessage(res.statusCode)};

    try {
      return json.decode(body);
    } catch (_) {
      return {'message': _fallbackMessage(res.statusCode)};
    }
  }

  static String _fallbackMessage(int statusCode) {
    if (statusCode == 502 || statusCode == 503 || statusCode == 504) {
      return 'Online backend is temporarily unavailable. Please try again shortly.';
    }
    if (statusCode >= 500) return 'Server error. Please try again shortly.';
    return 'Request failed (HTTP $statusCode).';
  }

  static Never _throwRequestError(http.Response res, String fallback) {
    final decoded = _decodeBody(res);
    if (decoded is Map && decoded['message'] != null) {
      throw Exception(decoded['message']);
    }
    throw Exception(fallback);
  }

  /// Retry wrapper for network errors (handles Render cold starts)
  static Future<http.Response> _retryRequest(
    Future<http.Response> Function() request, {
    int maxRetries = 2,
  }) async {
    for (int attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await request().timeout(const Duration(seconds: 60));
      } catch (e) {
        final isLast = attempt == maxRetries;
        final isNetworkError = e.toString().contains('SocketException') ||
            e.toString().contains('TimeoutException') ||
            e.toString().contains('Connection') ||
            e.toString().contains('Network') ||
            e.toString().contains('HandshakeException');
        if (isLast || !isNetworkError) rethrow;
        await Future<void>.delayed(const Duration(seconds: 2));
      }
    }
    throw Exception('Request failed after retries');
  }

  static Future<dynamic> get(String path) async {
    final hdrs = await _headers();
    final res = await _retryRequest(
      () => http.get(Uri.parse('$baseUrl$path'), headers: hdrs),
    );
    if (res.statusCode >= 200 && res.statusCode < 300) {
      return _decodeBody(res);
    }
    _throwRequestError(res, 'Request failed');
  }

  static Future<Uint8List> getBytes(String path) async {
    final hdrs = await _headers();
    final res = await _retryRequest(
      () => http.get(Uri.parse('$baseUrl$path'), headers: hdrs),
    );
    if (res.statusCode >= 200 && res.statusCode < 300) {
      return res.bodyBytes;
    }
    _throwRequestError(res, 'Failed to download file');
  }

  static Future<dynamic> post(String path, Map<String, dynamic> body) async {
    final hdrs = await _headers();
    final encoded = json.encode(body);
    final res = await _retryRequest(
      () => http.post(Uri.parse('$baseUrl$path'), headers: hdrs, body: encoded),
    );
    if (res.statusCode >= 200 && res.statusCode < 300) {
      return _decodeBody(res);
    }
    _throwRequestError(res, 'Request failed');
  }

  static Future<dynamic> put(String path, Map<String, dynamic> body) async {
    final hdrs = await _headers();
    final encoded = json.encode(body);
    final res = await _retryRequest(
      () => http.put(Uri.parse('$baseUrl$path'), headers: hdrs, body: encoded),
    );
    if (res.statusCode >= 200 && res.statusCode < 300) {
      return _decodeBody(res);
    }
    _throwRequestError(res, 'Request failed');
  }

  static Future<dynamic> delete(String path) async {
    final hdrs = await _headers();
    final res = await _retryRequest(
      () => http.delete(Uri.parse('$baseUrl$path'), headers: hdrs),
    );
    if (res.statusCode >= 200 && res.statusCode < 300) {
      return _decodeBody(res);
    }
    _throwRequestError(res, 'Request failed');
  }
}