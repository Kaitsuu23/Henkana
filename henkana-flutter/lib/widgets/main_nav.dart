import 'package:flutter/material.dart';

class MainNav extends InheritedWidget {
  final int currentIndex;
  final void Function(int) goTo;

  static const searchTab = 3;

  const MainNav({
    super.key,
    required this.currentIndex,
    required this.goTo,
    required super.child,
  });

  static MainNav of(BuildContext context) {
    final nav = context.dependOnInheritedWidgetOfExactType<MainNav>();
    assert(nav != null, 'MainNav not found in context');
    return nav!;
  }

  @override
  bool updateShouldNotify(MainNav old) => currentIndex != old.currentIndex;
}
