import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:memorial_web/app/models/user.dart';
import 'package:memorial_web/app/models/memorial.dart';
import 'package:memorial_web/app/services/api_client.dart';

/// Provider de autenticação que gerencia o estado do usuário logado.
/// Armazena o token e dados do usuário no SharedPreferences para persistência
/// entre sessões e recarregamentos da página (web).
class AuthProvider extends ChangeNotifier {
  AuthProvider() {
    _loadPersistedSession();
  }

  // --- Estado interno ---
  User? _user;
  String? _token;
  bool _isAuthenticated = false;
  DateTime? _tokenExpiry;

  // --- Getters ---
  User? get user => _user;
  String? get token => _token;
  bool get isAuthenticated => _isAuthenticated;

  /// Verifica se há sessão válida recuperada do armazenamento local.
  Future<void> _loadPersistedSession() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('auth_token');
    final tokenExpiry = prefs.getString('auth_token_expiry');
    final userJson = prefs.getString('user');

    if (token != null && tokenExpiry != null) {
      final expiryDate = DateTime.parse(tokenExpiry);
      if (expiryDate.isAfter(DateTime.now())) {
        _token = token;
        _isAuthenticated = true;
        // Rehidratar usuário a partir do JSON
        if (userJson != null) {
          _user = User.fromJson(userJson);
        }
      } else {
        // Token expirado, limpar
        await _clearSession();
      }
    }
  }

  /// Retorna se o usuário está autenticado.
  bool get isAuth => _isAuthenticated;

  /// Login: chama a API Flask e, em sucesso, persiste token + usuário.
  Future<void> login(String email, String password) async {
    final response = await ApiClient.post('/login', body: {'email': email, 'password': password});

    if (response.statusCode == 200) {
      final data = response.body; // esperamos: { "token": "...", "user": { ... }, "expires_in": ... }
      _token = data['token'];
      _user = User.fromJson(data['user']);
      _isAuthenticated = true;

      // Persistir no SharedPreferences
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('auth_token', _token!);
      await prefs.setString('auth_token_expiry', _tokenExpiry?.toIso8601String() ?? DateTime.now().add(const Duration(hours: 24)).toIso8601String());
      await prefs.setString('user', _user!.toJson());

      notifyListeners();
    } else {
      // Em caso de erro, lança ou retorna falso (o widget deve tratar)
      throw Exception('Credenciais inválidas: ${response.body}');
    }
  }

  /// Registro: chama a API Flask /registrar, faz login automático e salva sessão.
  Future<void> register(String name, String email, String password, String plano) async {
    final response = await ApiClient.post('/registrar', body: {'name': name, 'email': email, 'password': password, 'plano': plano});

    if (response.statusCode == 200) {
      final data = response.body;
      _token = data['token'];
      _user = User.fromJson(data['user']);
      _isAuthenticated = true;

      // Persistir
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('auth_token', _token!);
      await prefs.setString('auth_token_expiry', DateTime.now().add(const Duration(hours: 24)).toIso8601String());
      await prefs.setString('user', _user!.toJson());

      notifyListeners();
    } else {
      throw Exception('Erro ao registrar: ${response.body}');
    }
  }

  /// Logout: limpa token, usuário e SharedPreferences.
  Future<void> logout() async {
    _token = null;
    _user = null;
    _isAuthenticated = false;

    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    await prefs.remove('auth_token_expiry');
    await prefs.remove('user');

    notifyListeners();
  }

  /// Atualiza os dados do usuário (ex.: após edição de perfil).
  Future<void> updateUser(User updatedUser) async {
    _user = updatedUser;
    // Opcional: reenviar para API ou só atualizar localmente
    notifyListeners();
  }

  /// Verifica se o usuário tem permissão de admin baseado no email configurado.
  bool get isAdmin => _user != null && _user!.isAdmin;
}