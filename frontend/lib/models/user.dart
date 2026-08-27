import 'package:cloud_firestore/cloud.dart';
import 'package:equatable/equatable.dart';

class User extends Equatable {
  final int id;
  final String username;
  final String email;
  final String plano;
  final String planoStatus;
  final DateTime? planoInicio;
  final DateTime? planoExpiracao;
  final String? abacatepayExternalId;
  final String? abacatepayCheckoutId;
  final String? abacatepaySubscriptionId;
  final String? abacatepayPlanStatus;
  final String? plano;

  User({
    required this.id,
    required this.username,
    required this.email,
    required this.plano,
    required this.planoStatus,
    this.planoInicio,
    this.planoExpiracao,
    this.abacatepayExternalId,
    this.abacatepayCheckoutId,
    this.abacatepaySubscriptionId,
    this.abacatepayPlanStatus,
  });

  factory User.fromMap(Map<String, dynamic> map) {
    return User(
      id: map['id'] as int,
      username: map['username'] as String,
      email: map['email'] as String,
      plano: map['plano'] as String,
      planoStatus: map['planoStatus'] as String,
      planoInicio: map['planoInicio'] == null
          ? null
          : DateTime.parse(map['planoInicio'] as String),
      planoExpiracao:
          map['planoExpiracao'] == null
              ? null
              : DateTime.parse(map['planoExpiracao'] as String),
      abacatepayExternalId: map['abacatepayExternalId'] as String?,
      abacatepayCheckoutId: map['abacatepayCheckoutId'] as String?,
      abacatepaySubscriptionId: map['abacatepaySubscriptionId'] as String?,
      abacatepayPlanStatus: map['abacatepayPlanStatus'] as String?,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'username': username,
      'email': email,
      'plano': plano,
      'planoStatus': planoStatus,
      'planoInicio': planoInicio?.toIso8601String(),
      'planoExpiracao': planoExpiracao?.toIso8601String(),
      'abacatepayExternalId': abacatepayExternalId,
      'abacatepayCheckoutId': abacatepayCheckoutId,
      'abacatepaySubscriptionId': abacatepaySubscriptionId,
      'abacatepayPlanStatus': abacatepayPlanStatus,
    };
  }

  @override
  List<Object> get equality => [id, username, email, plano, planoStatus];

  @override
  String toString() => 'User(id: $id, username: $username, email: $email)';
}