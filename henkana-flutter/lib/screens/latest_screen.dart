import 'package:flutter/material.dart';
import '../providers/latest_provider.dart';
import '../models/anime_item.dart';
import '../widgets/anime_card.dart';
import '../widgets/shimmer_widgets.dart';
import '../widgets/app_error_widget.dart';
import '../utils/constants.dart';
import 'detail_screen.dart';
import 'watch_screen.dart';
import 'manga_detail_screen.dart';

// Card dimensions — match anime_screen.dart
const double _kCardHeight = 210.0;
const double _kGridPadding = 12.0;
const double _kGridSpacing = 10.0;
const int _kGridColumns = 3;

// ─── URL routing helpers (copied from home_screen.dart) ───────────────────────

enum _UrlType { episode, series, manga }

_UrlType _urlType(String url) {
  try {
    final path = Uri.parse(url).path;
    if (path.startsWith('/series/')) return _UrlType.series;
    if (path.startsWith('/manga/')) return _UrlType.manga;
  } catch (_) {}
  return _UrlType.episode;
}

String _getSeriesUrl(String url) {
  final cleanUrl = url.replaceAll(RegExp(r'/?$'), '');
  if (cleanUrl.contains(RegExp(r'[/\-.]episode-\d'))) {
    final match = RegExp(r'^(.+?)[/-]episode-\d').firstMatch(cleanUrl);
    if (match != null) return match.group(1)!;
  }
  return url;
}

PageRouteBuilder _fadeRoute(Widget page) => PageRouteBuilder(
      pageBuilder: (_, a, __) => page,
      transitionsBuilder: (_, a, __, child) => FadeTransition(
        opacity: a.drive(CurveTween(curve: Curves.easeIn)),
        child: child,
      ),
      transitionDuration: const Duration(milliseconds: 250),
    );

Widget _routedAnimeCard(AnimeItem item, BuildContext context) {
  final urlType = _urlType(item.url);
  final seriesUrl = _getSeriesUrl(item.url);
  return AnimeCard(
    item: item,
    onTap: () {
      switch (urlType) {
        case _UrlType.series:
          Navigator.push(context,
              _fadeRoute(DetailScreen(url: item.url, title: item.title)));
        case _UrlType.manga:
          Navigator.push(
              context,
              _fadeRoute(
                  MangaDetailScreen(url: item.url, title: item.title)));
        case _UrlType.episode:
          Navigator.push(
              context,
              _fadeRoute(WatchScreen(
                  url: item.url,
                  title: item.title,
                  thumbnail: item.thumbnail)));
      }
    },
    onEpisodeTap: () {
      Navigator.push(
          context,
          _fadeRoute(WatchScreen(
              url: item.url,
              title: item.title,
              thumbnail: item.thumbnail)));
    },
    onDetailTap: () {
      Navigator.push(context,
          _fadeRoute(DetailScreen(url: seriesUrl, title: item.title)));
    },
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

class LatestScreen extends StatefulWidget {
  const LatestScreen({super.key});

  @override
  State<LatestScreen> createState() => _LatestScreenState();
}

class _LatestScreenState extends State<LatestScreen> {
  late final LatestProvider _provider;
  final ScrollController _scroll = ScrollController();

  @override
  void initState() {
    super.initState();
    _provider = LatestProvider();
    _provider.fetch();
    _scroll.addListener(_onScroll);
  }

  void _onScroll() {
    if (_scroll.position.pixels >=
        _scroll.position.maxScrollExtent - 300) {
      _provider.loadMore();
    }
  }

  @override
  void dispose() {
    _scroll.dispose();
    _provider.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(AppConstants.bgColor),
      appBar: AppBar(
        backgroundColor: const Color(AppConstants.bgColor),
        title: const Text(
          'Terbaru',
          style: TextStyle(
            fontFamily: AppConstants.fontFamily,
            color: Color(AppConstants.textPrimary),
            fontWeight: FontWeight.w700,
          ),
        ),
        iconTheme:
            const IconThemeData(color: Color(AppConstants.textPrimary)),
        elevation: 0,
      ),
      body: ListenableBuilder(
        listenable: _provider,
        builder: (context, _) {
          if (_provider.isLoading && _provider.items.isEmpty) {
            return const GridShimmer();
          }
          if (_provider.hasError && _provider.items.isEmpty) {
            return AppErrorWidget(
              message: _provider.errorMessage,
              onRetry: _provider.refresh,
            );
          }
          return RefreshIndicator(
            color: const Color(AppConstants.primaryColor),
            backgroundColor: const Color(AppConstants.surfaceColor),
            onRefresh: _provider.refresh,
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
              itemCount: _provider.items.length +
                  (_provider.isLoading ? 3 : 0),
              itemBuilder: (_, i) {
                if (i >= _provider.items.length) {
                  return const ShimmerBox(
                    width: double.infinity,
                    height: _kCardHeight,
                    borderRadius: 10,
                  );
                }
                final item = _provider.items[i];
                return _AnimatedCard(
                  index: i,
                  child: _routedAnimeCard(item, context),
                );
              },
            ),
          );
        },
      ),
    );
  }
}

// ─── Animated card wrapper (copied from anime_screen.dart) ────────────────────

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
