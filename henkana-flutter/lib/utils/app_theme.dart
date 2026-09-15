import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'constants.dart';

class AppTheme {
  static ThemeData get darkTheme {
    return ThemeData(
      brightness: Brightness.dark,
      fontFamily: AppConstants.fontFamily,
      scaffoldBackgroundColor: const Color(AppConstants.bgColor),

      colorScheme: const ColorScheme.dark(
        // --primary ≈ #E8E8E8
        primary: Color(AppConstants.primaryColor),
        onPrimary: Color(AppConstants.primaryFgColor),
        // --card ≈ #282828
        surface: Color(AppConstants.cardColor),
        onSurface: Color(AppConstants.textPrimary),
        // --secondary/muted ≈ #373737
        secondary: Color(AppConstants.mutedColor),
        onSecondary: Color(AppConstants.textPrimary),
        // --border
        outline: Color(AppConstants.borderColor),
        error: Color(AppConstants.destructive),
      ),

      // ── AppBar ────────────────────────────────────────────────────────────
      // Matches header: h-14 (56dp), bg-background/95 with backdrop blur,
      // border-b border-border/40
      appBarTheme: AppBarTheme(
        backgroundColor: const Color(AppConstants.bgColor).withValues(alpha: 0.95),
        elevation: 0,
        scrolledUnderElevation: 0,
        titleTextStyle: const TextStyle(
          fontFamily: AppConstants.fontFamily,
          color: Color(AppConstants.textPrimary),
          fontSize: 15,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.2,
        ),
        iconTheme: const IconThemeData(color: Color(AppConstants.textPrimary)),
        systemOverlayStyle: SystemUiOverlayStyle.light,
        toolbarHeight: 56,
      ),

      // ── Bottom nav ────────────────────────────────────────────────────────
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: Color(AppConstants.surfaceColor),
        selectedItemColor: Color(AppConstants.primaryColor),
        unselectedItemColor: Color(AppConstants.textMuted),
        type: BottomNavigationBarType.fixed,
        elevation: 0,
      ),

      // ── Cards ─────────────────────────────────────────────────────────────
      // Sharp corners (radius 0) to match frontend
      cardTheme: const CardThemeData(
        color: Color(AppConstants.cardColor),
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.zero),
        margin: EdgeInsets.zero,
      ),

      // ── Dividers / borders ────────────────────────────────────────────────
      dividerColor: const Color(AppConstants.borderColor),
      dividerTheme: const DividerThemeData(
        color: Color(AppConstants.borderColor),
        thickness: 0.8,
        space: 0,
      ),

      // ── Text ─────────────────────────────────────────────────────────────
      textTheme: const TextTheme(
        // Section headers — text-xl font-bold = 20px / 700
        headlineLarge: TextStyle(
          fontFamily: AppConstants.fontFamily,
          color: Color(AppConstants.textPrimary),
          fontSize: 20,
          fontWeight: FontWeight.w700,
        ),
        // Sub headers — text-lg / 600
        headlineMedium: TextStyle(
          fontFamily: AppConstants.fontFamily,
          color: Color(AppConstants.textPrimary),
          fontSize: 17,
          fontWeight: FontWeight.w600,
        ),
        // text-sm font-bold = 14px / 700 (card titles)
        headlineSmall: TextStyle(
          fontFamily: AppConstants.fontFamily,
          color: Color(AppConstants.textPrimaryDim),
          fontSize: 14,
          fontWeight: FontWeight.w700,
          height: 1.35,
        ),
        // text-sm = 14px (body)
        bodyLarge: TextStyle(
          fontFamily: AppConstants.fontFamily,
          color: Color(AppConstants.textPrimary),
          fontSize: 14,
        ),
        // text-xs = 12px
        bodyMedium: TextStyle(
          fontFamily: AppConstants.fontFamily,
          color: Color(AppConstants.textSecondary),
          fontSize: 12,
        ),
        // text-[11px]
        bodySmall: TextStyle(
          fontFamily: AppConstants.fontFamily,
          color: Color(AppConstants.textSecondary),
          fontSize: 11,
        ),
        // text-[10px] — badges
        labelSmall: TextStyle(
          fontFamily: AppConstants.fontFamily,
          color: Color(AppConstants.textSecondary),
          fontSize: 10,
          fontWeight: FontWeight.w600,
          letterSpacing: 0.3,
        ),
      ),

      // ── Input ─────────────────────────────────────────────────────────────
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: const Color(AppConstants.mutedColor),
        hintStyle: const TextStyle(
          fontFamily: AppConstants.fontFamily,
          color: Color(AppConstants.textMuted),
        ),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppConstants.inputRadius),
          borderSide: const BorderSide(color: Color(AppConstants.borderColor)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppConstants.inputRadius),
          borderSide: const BorderSide(color: Color(AppConstants.borderColor)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppConstants.inputRadius),
          borderSide: const BorderSide(
              color: Color(AppConstants.primaryColor), width: 1.5),
        ),
      ),

      // ── Buttons ───────────────────────────────────────────────────────────
      // Pill-style for nav (rounded-full), sharp for most others
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(AppConstants.primaryColor),
          foregroundColor: const Color(AppConstants.primaryFgColor),
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius:
                BorderRadius.circular(AppConstants.pillRadius),
          ),
          padding:
              const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
          textStyle: const TextStyle(
            fontFamily: AppConstants.fontFamily,
            fontWeight: FontWeight.w600,
            fontSize: 13,
          ),
        ),
      ),

      // ── TabBar ────────────────────────────────────────────────────────────
      tabBarTheme: const TabBarThemeData(
        labelColor: Color(AppConstants.textPrimary),
        unselectedLabelColor: Color(AppConstants.textSecondary),
        indicatorColor: Color(AppConstants.primaryColor),
        dividerColor: Color(AppConstants.borderColor),
      ),

      useMaterial3: true,
    );
  }
}
