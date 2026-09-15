import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../utils/constants.dart';

/// Flat text tab bar — no pills, no borders, no backgrounds.
/// Active: white label + pink underline indicator with glow.
/// Inactive: muted label, nothing else.
class PillTabBar extends StatefulWidget implements PreferredSizeWidget {
  final TabController controller;
  final List<String> tabs;

  const PillTabBar({
    super.key,
    required this.controller,
    required this.tabs,
  });

  @override
  Size get preferredSize => const Size.fromHeight(40);

  @override
  State<PillTabBar> createState() => _PillTabBarState();
}

class _PillTabBarState extends State<PillTabBar> {
  @override
  void initState() {
    super.initState();
    widget.controller.addListener(_onControllerChange);
  }

  void _onControllerChange() {
    if (mounted) setState(() {});
  }

  @override
  void dispose() {
    widget.controller.removeListener(_onControllerChange);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 40,
      decoration: const BoxDecoration(
        border: Border(
          bottom: BorderSide(color: Color(AppConstants.borderColor), width: 0.6),
        ),
      ),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: List.generate(widget.tabs.length, (i) {
            final active = widget.controller.index == i;
            return _FlatTab(
              label: widget.tabs[i],
              isActive: active,
              onTap: () {
                HapticFeedback.selectionClick();
                widget.controller.animateTo(i);
              },
            );
          }),
        ),
      ),
    );
  }
}

class _FlatTab extends StatefulWidget {
  final String label;
  final bool isActive;
  final VoidCallback onTap;

  const _FlatTab({
    required this.label,
    required this.isActive,
    required this.onTap,
  });

  @override
  State<_FlatTab> createState() => _FlatTabState();
}

class _FlatTabState extends State<_FlatTab>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  late final Animation<double> _anim;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 200),
      value: widget.isActive ? 1.0 : 0.0,
    );
    _anim = CurvedAnimation(parent: _ctrl, curve: Curves.easeOut);
  }

  @override
  void didUpdateWidget(_FlatTab old) {
    super.didUpdateWidget(old);
    if (widget.isActive != old.isActive) {
      widget.isActive ? _ctrl.forward() : _ctrl.reverse();
    }
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: widget.onTap,
      child: AnimatedBuilder(
        animation: _anim,
        builder: (_, __) {
          final t = _anim.value;
          return Container(
            margin: const EdgeInsets.only(right: 24),
            child: Stack(
              alignment: Alignment.bottomCenter,
              children: [
                // Label
                Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Text(
                    widget.label,
                    style: TextStyle(
                      color: Color.lerp(
                        const Color(AppConstants.textMuted),
                        Colors.white,
                        t,
                      ),
                      fontSize: 13,
                      fontWeight: t > 0.5 ? FontWeight.w700 : FontWeight.w500,
                    ),
                  ),
                ),
                // Underline indicator
                if (t > 0)
                  Positioned(
                    bottom: 0,
                    child: Container(
                      width: _textWidth(widget.label),
                      height: 2,
                      decoration: BoxDecoration(
                        color: Color.lerp(
                          Colors.transparent,
                          const Color(AppConstants.primaryColor),
                          t,
                        ),
                        borderRadius: BorderRadius.circular(1),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.white.withValues(alpha: 0.35 * t),
                            blurRadius: 4,
                            spreadRadius: 0,
                          ),
                        ],
                      ),
                    ),
                  ),
              ],
            ),
          );
        },
      ),
    );
  }

  double _textWidth(String label) {
    final tp = TextPainter(
      text: TextSpan(
        text: label,
        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
      ),
      textDirection: TextDirection.ltr,
    )..layout();
    return tp.width;
  }
}
