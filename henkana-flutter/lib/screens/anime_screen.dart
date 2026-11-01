import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/anime_provider.dart';
import '../providers/latest_provider.dart';
import '../models/anime_item.dart';
import '../widgets/anime_card.dart';
import '../widgets/shimmer_widgets.dart';
import '../widgets/app_error_widget.dart';
import '../widgets/pill_tab_bar.dart';
import '../utils/constants.dart';
import 'detail_screen.dart';
import 'watch_screen.dart';

const double _kCardHeight = 210.0;
const double _kGridPadding = 12.0;
const double _kGridSpacing = 10.0;
const int _kGridColumns = 3;

// URL routing — episode path → WatchScreen, series path → DetailScreen
enum _UrlType { episode, series }

_UrlType _urlType(String url) {
  try {
    final path = Uri.parse(url).path;
    if (path.startsWith('/series/')) return _UrlType.series;
  } catch (_) {}
  return _UrlType.episode;
}

class AnimeScreen extends StatefulWidget {
  const AnimeScreen({super.key});

  @override
  State<AnimeScreen> createState() => _AnimeScreenState();
}

class _AnimeScreenState extends State<AnimeScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabCtrl;

  final List<String> _tabs = ['Hentai', 'Uncensored', 'JAV'];

  // Hentai (index 0) uses LatestProvider with type=hentai
  // Uncensored + JAV use AnimeListProvider
  late final LatestProvider _hentaiProvider;
  final List<AnimeListProvider> _otherProviders = [];

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(length: _tabs.length, vsync: this);

    _hentaiProvider = LatestProvider(type: 'hentai');
    _hentaiProvider.fetch();

    for (final ep in ['uncensored', 'jav']) {
      _otherProviders.add(AnimeListProvider(endpoint: ep));
    }

    _tabCtrl.addListener(() {
      if (!_tabCtrl.indexIsChanging) {
        if (_tabCtrl.index == 0) {
          if (_hentaiProvider.state == LoadState.idle) _hentaiProvider.fetch();
        } else {
          final p = _otherProviders[_tabCtrl.index - 1];
          if (p.state == LoadState.idle) p.fetch();
        }
      }
    });
  }

  @override
  void dispose() {
    _tabCtrl.dispose();
    _hentaiProvider.dispose();
    for (final p in _otherProviders) {
      p.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(AppConstants.bgColor),
      appBar: AppBar(
        backgroundColor: const Color(AppConstants.bgColor),
        title: const Text('Anime'),
        bottom: PillTabBar(
          controller: _tabCtrl,
          tabs: _tabs,
        ),
      ),
      body: TabBarView(
        controller: _tabCtrl,
        children: [
          // Tab 0 — Hentai via daftar-series?order=update&type=hentai
          ChangeNotifierProvider.value(
            value: _hentaiProvider,
            child: const _LatestTabBody(),
          ),
          // Tab 1, 2 — Uncensored, JAV via /api/uncensored, /api/jav
          ...List.generate(
            _otherProviders.length,
            (i) => ChangeNotifierProvider.value(
              value: _otherProviders[i],
              child: const _AnimeTabBody(),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Hentai tab body (uses LatestProvider) ────────────────────────────────────

class _LatestTabBody extends StatefulWidget {
  const _LatestTabBody();

  @override
  State<_LatestTabBody> createState() => _LatestTabBodyState();
}

class _LatestTabBodyState extends State<_LatestTabBody> {
  final ScrollController _scroll = ScrollController();

  @override
  void initState() {
    super.initState();
    _scroll.addListener(_onScroll);
  }

  void _onScroll() {
    if (_scroll.position.pixels >= _scroll.position.maxScrollExtent - 300) {
      context.read<LatestProvider>().loadMore();
    }
  }

  @override
  void dispose() {
    _scroll.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<LatestProvider>(
      builder: (_, prov, __) {
        if (prov.isLoading && prov.items.isEmpty) {
          return const GridShimmer();
        }
        if (prov.hasError && prov.items.isEmpty) {
          return AppErrorWidget(
            message: prov.errorMessage,
            onRetry: prov.refresh,
          );
        }
        return RefreshIndicator(
          color: const Color(AppConstants.primaryColor),
          backgroundColor: const Color(AppConstants.surfaceColor),
          onRefresh: prov.refresh,
          child: GridView.builder(
            controller: _scroll,
            padding: const EdgeInsets.all(_kGridPadding),
            physics: const AlwaysScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: _kGridColumns,
              mainAxisSpacing: _kGridSpacing,
              crossAxisSpacing: _kGridSpacing,
              mainAxisExtent: _kCardHeight,
            ),
            itemCount: prov.items.length + (prov.isLoading ? 3 : 0),
            itemBuilder: (_, i) {
              if (i >= prov.items.length) {
                return const ShimmerBox(
                  width: double.infinity,
                  height: _kCardHeight,
                  borderRadius: 0,
                );
              }
              final item = prov.items[i];
              return _AnimatedCard(
                index: i,
                child: AnimeCard(
                  item: item,
                  onTap: () => _navigate(context, item),
                ),
              );
            },
          ),
        );
      },
    );
  }

  void _navigate(BuildContext context, AnimeItem item) {
    switch (_urlType(item.url)) {
      case _UrlType.series:
        Navigator.push(context,
            _fadeRoute(DetailScreen(url: item.url, title: item.title)));
      case _UrlType.episode:
        Navigator.push(context,
            _fadeRoute(WatchScreen(
                url: item.url,
                title: item.title,
                thumbnail: item.thumbnail)));
    }
  }
}

// ─── Other tab body (uses AnimeListProvider) ─────────────────────────────────

class _AnimeTabBody extends StatefulWidget {
  const _AnimeTabBody();

  @override
  State<_AnimeTabBody> createState() => _AnimeTabBodyState();
}

class _AnimeTabBodyState extends State<_AnimeTabBody> {
  final ScrollController _scroll = ScrollController();

  @override
  void initState() {
    super.initState();
    _scroll.addListener(_onScroll);
  }

  void _onScroll() {
    if (_scroll.position.pixels >= _scroll.position.maxScrollExtent - 300) {
      context.read<AnimeListProvider>().loadMore();
    }
  }

  @override
  void dispose() {
    _scroll.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<AnimeListProvider>(
      builder: (_, prov, __) {
        if (prov.isLoading && prov.items.isEmpty) {
          return const GridShimmer();
        }
        if (prov.hasError && prov.items.isEmpty) {
          return AppErrorWidget(
            message: prov.errorMessage,
            onRetry: prov.refresh,
          );
        }
        return RefreshIndicator(
          color: const Color(AppConstants.primaryColor),
          backgroundColor: const Color(AppConstants.surfaceColor),
          onRefresh: prov.refresh,
          child: GridView.builder(
            controller: _scroll,
            padding: const EdgeInsets.all(_kGridPadding),
            physics: const AlwaysScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: _kGridColumns,
              mainAxisSpacing: _kGridSpacing,
              crossAxisSpacing: _kGridSpacing,
              mainAxisExtent: _kCardHeight,
            ),
            itemCount: prov.items.length + (prov.isLoading ? 3 : 0),
            itemBuilder: (_, i) {
              if (i >= prov.items.length) {
                return const ShimmerBox(
                  width: double.infinity,
                  height: _kCardHeight,
                  borderRadius: 0,
                );
              }
              final item = prov.items[i];
              return _AnimatedCard(
                index: i,
                child: AnimeCard(
                  item: item,
                  onTap: () => Navigator.push(
                    context,
                    _fadeRoute(DetailScreen(url: item.url, title: item.title)),
                  ),
                ),
              );
            },
          ),
        );
      },
    );
  }
}

// ─── Animated card wrapper ────────────────────────────────────────────────────

class _AnimatedCard extends StatefulWidget {
  final int index;
  final Widget child;
  const _AnimatedCard({required this.index, required this.child});

  @override
  State<_AnimatedCard> createState() => _AnimatedCardState();
}

class _AnimatedCardState extends State<_AnimatedCard>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _opacity;
  late Animation<Offset> _slide;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: Duration(milliseconds: 280 + (widget.index % 6) * 30),
    );
    _opacity = CurvedAnimation(parent: _ctrl, curve: Curves.easeIn);
    _slide = Tween<Offset>(
      begin: const Offset(0, 0.08),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _ctrl, curve: Curves.easeOut));
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
      child: SlideTransition(position: _slide, child: widget.child),
    );
  }
}

PageRouteBuilder _fadeRoute(Widget page) => PageRouteBuilder(
      pageBuilder: (_, a, __) => page,
      transitionsBuilder: (_, a, __, child) => FadeTransition(
        opacity: a.drive(CurveTween(curve: Curves.easeIn)),
        child: child,
      ),
      transitionDuration: const Duration(milliseconds: 250),
    );
