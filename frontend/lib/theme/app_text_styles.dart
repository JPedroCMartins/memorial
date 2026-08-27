import 'package:flutter/material.dart';
import 'app_colors.dart';

class AppTextStyles {
  // TextStyles usando as cores do AppColors
  // As métodos recebem BuildContext para acessar as cores

  // Título serifado (Playfair Display)
  static TextStyle titleSerif(BuildContext context) => TextStyle(
    fontFamily: 'PlayfairDisplay',
    fontWeight: FontWeight.w600,
    fontSize: 24,
    color: AppColors.text,
  );

  // Corpo do texto em muted
  static TextStyle bodyMuted(BuildContext context) => TextStyle(
    fontFamily: 'Inter',
    fontWeight: FontWeight.w400,
    fontSize: 14,
    color: AppColors.textMuted,
  );

  // Corpo principal
  static TextStyle bodyLarge(BuildContext context) => TextStyle(
    fontFamily: 'Inter',
    fontWeight: FontWeight.w400,
    fontSize: 18,
    color: AppColors.text,
  );

  // Texto em negrito 14
  static TextStyle bold14(BuildContext context) => TextStyle(
    fontFamily: 'Inter',
    fontWeight: FontWeight.w600,
    fontSize: 14,
    color: AppColors.text,
  );
