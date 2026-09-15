import 'package:flutter/material.dart';
import '../utils/constants.dart';

/// Reusable error state widget with retry button and animated entrance.
class AppErrorWidget extends StatefulWidget {
  final String message;
  final VoidCallback? onRetry;
  final String retryLabel;
  final IconData icon;

  const AppErrorWidget({
    super.key,
    required this.message,
    this.onRetry,
    this.retryLabel = 'Coba Lagi',
    this.icon = Icons.wifi_off_rounded,
  });

  @override
  State<AppErrorWidget> createState() => _AppErrorWidgetState();
}

class _AppErrorWidgetState extends State<AppErrorWidget>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  late final Animation<double> _scale;
  late final Animation<double> _opacity;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 400),
    );
    _scale = CurvedAnimation(parent: _ctrl, curve: Curves.easeOutBack)
        .drive(Tween(begin: 0.8, end: 1.0));
    _opacity = CurvedAnimation(parent: _ctrl, curve: Curves.easeIn)
        .drive(Tween(begin: 0.0, end: 1.0));
    _ctrl.forward();
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _opacity,
      child: ScaleTransition(
        scale: _scale,
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 72,
                  height: 72,
                  decoration: BoxDecoration(
                    color: const Color(AppConstants.primaryColor).withValues(alpha: 0.08),
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: const Color(AppConstants.primaryColor).withValues(alpha: 0.20),
                    ),
                  ),
                  child: Icon(
                    widget.icon,
                    color: const Color(AppConstants.primaryColor),
                    size: 34,
                  ),
                ),
                const SizedBox(height: 20),
                const Text(
                  'Oops!',
                  style: TextStyle(
                    color: Color(AppConstants.textPrimary),
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  widget.message,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    color: Color(AppConstants.textSecondary),
                    fontSize: 13,
                    height: 1.5,
                  ),
                ),
                if (widget.onRetry != null) ...[
                  const SizedBox(height: 24),
                  _RetryButton(
                    label: widget.retryLabel,
                    onTap: widget.onRetry!,
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _RetryButton extends StatefulWidget {
  final String label;
  final VoidCallback onTap;
  const _RetryButton({required this.label, required this.onTap});

  @override
  State<_RetryButton> createState() => _RetryButtonState();
}

class _RetryButtonState extends State<_RetryButton>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  late final Animation<double> _scale;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 120),
      lowerBound: 0.95,
      upperBound: 1.0,
      value: 1.0,
    );
    _scale = _ctrl.drive(CurveTween(curve: Curves.easeInOut));
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => _ctrl.reverse(),
      onTapUp: (_) {
        _ctrl.forward();
        widget.onTap();
      },
      onTapCancel: () => _ctrl.forward(),
      child: ScaleTransition(
        scale: _scale,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 12),
          decoration: BoxDecoration(
            color: const Color(AppConstants.primaryColor),
            borderRadius: BorderRadius.circular(AppConstants.pillRadius),
          ),
          child: Text(
            widget.label,
            style: const TextStyle(
              color: Color(AppConstants.primaryFgColor), // dark text on white button
              fontWeight: FontWeight.w700,
              fontSize: 14,
            ),
          ),
        ),
      ),
    );
  }
}

/// Inline small error banner — for embedded error states.
class InlineError extends StatelessWidget {
  final String message;
  final VoidCallback? onRetry;

  const InlineError({super.key, required this.message, this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: const Color(AppConstants.primaryColor).withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: const Color(AppConstants.primaryColor).withValues(alpha: 0.2),
        ),
      ),
      child: Row(
        children: [
          const Icon(Icons.error_outline,
              color: Color(AppConstants.primaryColor), size: 18),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              message,
              style: const TextStyle(
                color: Color(AppConstants.textSecondary),
                fontSize: 12,
              ),
            ),
          ),
          if (onRetry != null) ...[
            const SizedBox(width: 8),
            GestureDetector(
              onTap: onRetry,
              child: const Text(
                'Retry',
                style: TextStyle(
                  color: Color(AppConstants.primaryColor),
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
