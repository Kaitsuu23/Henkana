import 'package:flutter/material.dart';
import '../utils/constants.dart';

/// Fake glass card — no BackdropFilter.
/// Uses layered semi-transparent containers + subtle border + inner highlight.
class GlassCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final double borderRadius;
  final Color? baseColor;
  final Color? borderColor;
  final double elevation;
  final VoidCallback? onTap;
  final double? width;
  final double? height;

  const GlassCard({
    super.key,
    required this.child,
    this.padding,
    this.margin,
    this.borderRadius = 16,
    this.baseColor,
    this.borderColor,
    this.elevation = 0,
    this.onTap,
    this.width,
    this.height,
  });

  @override
  Widget build(BuildContext context) {
    final base = baseColor ?? const Color(AppConstants.cardColor);
    final border = borderColor ?? const Color(AppConstants.borderColor);

    Widget card = Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(borderRadius),
        color: base,
        border: Border.all(color: border, width: 0.8),
        boxShadow: elevation > 0
            ? [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.35),
                  blurRadius: elevation * 4,
                  offset: Offset(0, elevation * 2),
                ),
              ]
            : null,
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(borderRadius - 1),
        child: Stack(
          children: [
            // subtle top-left shine
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              child: Container(
                height: borderRadius * 1.5,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Colors.white.withValues(alpha: 0.04),
                      Colors.transparent,
                    ],
                  ),
                ),
              ),
            ),
            Padding(
              padding: padding ?? const EdgeInsets.all(16),
              child: child,
            ),
          ],
        ),
      ),
    );

    if (onTap != null) {
      card = Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(borderRadius),
          onTap: onTap,
          splashColor: const Color(AppConstants.primaryColor).withValues(alpha: 0.1),
          highlightColor: Colors.white.withValues(alpha: 0.03),
          child: card,
        ),
      );
    }

    if (margin != null) {
      card = Padding(padding: margin!, child: card);
    }

    return card;
  }
}

/// Accent glass card with pink tint — for featured / hero items.
class AccentGlassCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final double borderRadius;
  final VoidCallback? onTap;

  const AccentGlassCard({
    super.key,
    required this.child,
    this.padding,
    this.borderRadius = 16,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      padding: padding,
      borderRadius: borderRadius,
      onTap: onTap,
      baseColor: const Color(0xFF1E1525),
      borderColor: const Color(AppConstants.primaryColor).withValues(alpha: 0.35),
      elevation: 4,
      child: child,
    );
  }
}
