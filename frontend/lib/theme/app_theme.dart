import 'package:flutter/material.dart';
import 'app_colors.dart';

class AppTheme {
  AppTheme._();

  static ThemeData light() {
    return ThemeData(
      useMaterial3: false,
      scaffoldBackgroundColor: AppColors.bg,
      textTheme: _buildTextTheme(),
      colorScheme: ColorScheme.dark(
        backgroundColor: AppColors.bg,
        surfaceColor: AppColors.card,
        errorColor: AppColors.danger,
        primary: AppColors.gold,
        onPrimary: Color(0xFF141414),
        onSurface: AppColors.text,
        onSurfaceVariant: AppColors.textMuted,
      ),
      cardTheme: CardThemeData(
        color: AppColors.card,
        elevation: 8,
        shadowColor: Color(0x20000000),
        shape: ShapeBorder.lerp(
          const RoundedRectangleBorder(),
          RoundedRectangleBorder.borderRadius(BorderRadius.circular(16)),
          1,
        ),
      ),
      dividerTheme: DividerThemeData(
        color: AppColors.border,
        thickness: 1,
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: Color(0xFF151516),
        foregroundColor: AppColors.text,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: TextStyle(
          fontFamily: 'Inter',
          fontWeight: FontWeight.w600,
          fontSize: 18,
          color: Color(0xFFEAE7E2),
        ),
      ),
    );
  }

  static ThemeData dark() => light();

  static BorderRadius radius(double value) => BorderRadius.circular(value);
}

extension BorderRadiusX on BorderRadius {
  static BorderRadius radius(double value) => BorderRadius.circular(value);