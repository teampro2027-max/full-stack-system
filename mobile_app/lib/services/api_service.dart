import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;

import 'package:flutter/foundation.dart';

class ApiService {
  static const String baseUrl = kIsWeb ? 'http://localhost:5000/api' : 'http://10.0.2.2:5000/api';
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

  static Future<dynamic> get(String path) async {
    final res = await http.get(
      Uri.parse('$baseUrl$path'),
      headers: await _headers(),
    );
    if (res.statusCode >= 200 && res.statusCode < 300) {
      return json.decode(res.body);
    }
    throw Exception(json.decode(res.body)['message'] ?? 'Request failed');
  }

  static Future<Uint8List> getBytes(String path) async {
    final res = await http.get(
      Uri.parse('$baseUrl$path'),
      headers: await _headers(),
    );
    if (res.statusCode >= 200 && res.statusCode < 300) {
      return res.bodyBytes;
    }
    throw Exception('Failed to download file');
  }

  static Future<dynamic> post(String path, Map<String, dynamic> body) async {
    final res = await http.post(
      Uri.parse('$baseUrl$path'),
      headers: await _headers(),
      body: json.encode(body),
    );
    if (res.statusCode >= 200 && res.statusCode < 300) {
      return json.decode(res.body);
    }
    throw Exception(json.decode(res.body)['message'] ?? 'Request failed');
  }

  static Future<dynamic> put(String path, Map<String, dynamic> body) async {
    final res = await http.put(
      Uri.parse('$baseUrl$path'),
      headers: await _headers(),
      body: json.encode(body),
    );
    if (res.statusCode >= 200 && res.statusCode < 300) {
      return json.decode(res.body);
    }
    throw Exception(json.decode(res.body)['message'] ?? 'Request failed');
  }

  static Future<dynamic> delete(String path) async {
    final res = await http.delete(
      Uri.parse('$baseUrl$path'),
      headers: await _headers(),
    );
    if (res.statusCode >= 200 && res.statusCode < 300) {
      return json.decode(res.body);
    }
    throw Exception(json.decode(res.body)['message'] ?? 'Request failed');
  }
}
