import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../providers/search_provider.dart';
import '../utils/constants.dart';
import '../widgets/main_nav.dart';
import 'home_screen.dart';
import 'anime_screen.dart';
import 'manga_screen.dart';
import 'search_screen.dart';
import 'genre_list_screen.dart';

class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen>
    with SingleTickerProviderStateMixin {
  int _currentIndex = 0;

  // Pages are NOT kept alive — each tab rebuild from scratch on switch
  static const List<Widget> _pages = [
    HomeScreen(),
    AnimeScreen(),
    MangaScreen(),
    SearchScreen(),
    GenreListScreen(),
  ];

  static const int _searchTab = 3;

  void _onTap(int index) {
    if (index == _currentIndex) return;
    HapticFeedback.selectionClick();
    if (_currentIndex == _searchTab) {
      context.read<SearchProvider>().clear();
    }
    setState(() => _currentIndex = index);
  }

  @override
  Widget build(BuildContext context) {
    return MainNav(
      currentIndex: _currentIndex,
      goTo: _onTap,
      child: Scaffold(
        backgroundColor: const Color(AppConstants.bgColor),
        body: _pages[_currentIndex],
        bottomNavigationBar: _BottomNav(
          currentIndex: _currentIndex,
          onTap: _onTap,
        ),
      ),
    );
  }
}

// ─── custom bottom nav ────────────────────────────────────────────────────────

class _BottomNav extends StatelessWidget {
  final int currentIndex;
  final void Function(int) onTap;

  const _BottomNav({required this.currentIndex, required this.onTap});

  static const _items = [
    _NavItem(icon: Icons.home_outlined, activeIcon: Icons.home_rounded, label: 'Beranda'),
    _NavItem(icon: Icons.play_circle_outline_rounded, activeIcon: Icons.play_circle_rounded, label: 'Anime'),
    _NavItem(icon: Icons.menu_book_outlined, activeIcon: Icons.menu_book_rounded, label: 'Manga'),
    _NavItem(icon: Icons.search_outlined, activeIcon: Icons.search_rounded, label: 'Cari'),
    _NavItem(icon: Icons.tag_outlined, activeIcon: Icons.tag_rounded, label: 'Genre'),
  ];

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(AppConstants.surfaceColor),
        border: const Border(
          top: BorderSide(color: Color(AppConstants.borderColor), width: 0.8),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.3),
            blurRadius: 12,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: SizedBox(
        height: 70,
        child: Row(
          children: List.generate(
            _items.length,
            (i) => Expanded(
              child: _NavButton(
                item: _items[i],
                isActive: i == currentIndex,
                onTap: () => onTap(i),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _NavItem {
  final IconData icon;
  final IconData activeIcon;
  final String label;
  const _NavItem({
    required this.icon,
    required this.activeIcon,
    required this.label,
  });
}

class _NavButton extends StatefulWidget {
  final _NavItem item;
  final bool isActive;
  final VoidCallback onTap;

  const _NavButton({
    required this.item,
    required this.isActive,
    required this.onTap,
  });

  @override
  State<_NavButton> createState() => _NavButtonState();
}

class _NavButtonState extends State<_NavButton>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 200),
      value: widget.isActive ? 1.0 : 0.0,
    );
  }

  @override
  void didUpdateWidget(_NavButton old) {
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
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          SizedBox(
            height: 36,
            child: AnimatedBuilder(
              animation: _ctrl,
              builder: (_, __) {
                final t = _ctrl.value;
                return Icon(
                  widget.isActive ? widget.item.activeIcon : widget.item.icon,
                  // Active: white (#FAFAFA), inactive: muted (#666)
                  color: Color.lerp(
                    const Color(AppConstants.textMuted),
                    const Color(AppConstants.textPrimary),
                    t,
                  ),
                  size: 26 + (t * 1.0), // slight size grow
                );
              },
            ),
          ),
          const SizedBox(height: 2),
          AnimatedDefaultTextStyle(
            duration: const Duration(milliseconds: 200),
            style: TextStyle(
              fontFamily: AppConstants.fontFamily,
              color: widget.isActive
                  ? const Color(AppConstants.textPrimary)
                  : const Color(AppConstants.textMuted),
              fontSize: 10,
              fontWeight: widget.isActive ? FontWeight.w700 : FontWeight.w500,
            ),
            child: Text(widget.item.label),
          ),
        ],
      ),
    );
  }
}
