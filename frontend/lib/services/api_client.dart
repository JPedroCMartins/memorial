import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter/material.dart';
import 'package:memorial_web/app/models/user.dart';

/// Serviço de comunicação com a API Flask.
/// Responsável por definir headers (cookie de sessão), tratar erros
/// e proporcionar métodos para os endpoints da API.
class ApiClient {
  /// Retorna o [String] do cookie session a partir do SharedPreferences.
  static Future<String?> _getSessionCookie() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('session');
  }

  /// Constrói o [Map] de headers HTTP adicionando o cookie session
  /// sempre que há um contexto de request (pode ser chamado por roteador).
  static Future<Map<String, String>> _getHeaders() async {
    final cookie = await _getSessionCookie();
    final headers = <String, String>{'Content-Type': 'application/json'};
    if (cookie != null) {
      headers['Cookie'] = 'session=$cookie';
    }
    return headers;
  }

  /// GET genérico
  static Future<Map<String, dynamic>> get(String path) async {
    final headers = await _getHeaders();
    final uri = Uri.parse('http://localhost:5001$path');
    final response = await Uri.http(uri, path, headers: headers);
    return _handleResponse(response);
  }

  /// POST genérico
  static Future<Map<String, dynamic>> post(String path, {required Map<String, dynamic> body}) async {
    final headers = await _getHeaders();
    final response = await Uri.http('http://localhost:5001$path', '', headers: headers, method: 'POST', body: json.encode(body));
    return _handleResponse(response);
  }

  /// PUT genérico
  static Future<Map<String, dynamic>> put(String path, {required Map<String, dynamic> body}) async {
    final headers = await _getHeaders();
    final response = await Uri.http('http://localhost:5001$path', '', headers: headers, method: 'PUT', body: json.encode(body));
    return _handleResponse(response);
  }

  /// DELETE genérico
  static Future<Map<String, dynamic>> delete(String path) async {
    final headers = await _getHeaders();
    final response = await Uri.http('http://localhost:5001$path', '', headers: headers, method: 'DELETE');
    return _handleResponse(response);
  }

  /// Tratamento centralizado de respostas da API
  static Map<String, dynamic> _handleResponse(http.Response response) {
    if (response.statusCode >= 200 && response.statusCode < 300) {
      try {
        return json.decode(response.body);
      } catch (_) {
        return {};
      }
    }
    // Em 401 ou 403, podemos lançar ou apenas retornar o corpo
    if (response.statusCode == 401 || response.statusCode == 403) {
      // O frontend pode verificar isAuthenticated e redirectar
      return {'error': response.body, 'code': response.statusCode};
    }
    return {'error': response.body, 'code': response.statusCode};
  }
}