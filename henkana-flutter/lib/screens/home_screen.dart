import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/home_provider.dart';
import '../models/home_section.dart';
import '../models/anime_item.dart';
import '../models/manga_item.dart';
import '../widgets/anime_card.dart';
import '../widgets/manga_card.dart';
import '../widgets/shimmer_widgets.dart';
import '../widgets/app_error_widget.dart';
import '../utils/constants.dart';
import '../widgets/main_nav.dart';
import 'detail_screen.dart';
import 'watch_screen.dart';
import 'manga_detail_screen.dart';
import 'manga_reader_screen.dart';
import 'latest_screen.dart';

// ─── URL routing helper (mirrors Next.js getSlugFromUrl) ─────────────────────
//
// Episode URL  : hentaicop.com/kanojo-saimin-episode-2/  → WatchScreen
// Series URL   : hentaicop.com/series/kanojo-saimin/     → DetailScreen
// Manga URL    : hentaicop.com/manga/some-slug/          → MangaDetailScreen

enum _UrlType { episode, series, manga }

_UrlType _urlType(String url) {
  try {
    final path = Uri.parse(url).path;
    if (path.startsWith('/series/')) return _UrlType.series;
    if (path.startsWith('/manga/')) return _UrlType.manga;
  } catch (_) {}
  return _UrlType.episode; // default: episode URL
}

Widget _routedAnimeCard(
  AnimeItem item,
  BuildContext context, {
  void Function()? onTap,
}) {
  final urlType = _urlType(item.url);
  
  // Get series URL from episode URL by removing the episode part
  // Following the same logic as the frontend: strip "-episode-N" suffix
  String getSeriesUrl(String url) {
    // Remove trailing slash if present
    final cleanUrl = url.replaceAll(RegExp(r'/?$'), '');
    
    // Check if it's an episode URL (contains /episode-N or -episode-N)
    if (cleanUrl.contains(RegExp(r'[/\-.]episode-\d'))) {
      // Match pattern: /episode-N/ or -episode-N
      final match = RegExp(r'^(.+?)[/-]episode-\d').firstMatch(cleanUrl);
      if (match != null) {
        return match.group(1)!;
      }
    }
    return url;
  }
  
  final seriesUrl = getSeriesUrl(item.url);
  
  return AnimeCard(
    item: item,
    onTap: onTap ??
        () {
          // Tap always goes to detail for series, watch for episode
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
      // Episode tap from popup - goes to watch screen
      Navigator.push(
          context,
          _fadeRoute(WatchScreen(
              url: item.url,
              title: item.title,
              thumbnail: item.thumbnail)));
    },
    onDetailTap: () {
      // Detail tap from popup - always goes to detail screen with series URL
      Navigator.push(context,
          _fadeRoute(DetailScreen(url: seriesUrl, title: item.title)));
    },
  );
}

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<HomeProvider>().fetchHome();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(AppConstants.bgColor),
      body: SafeArea(
        child: Consumer<HomeProvider>(
          builder: (_, prov, __) {
            if (prov.isLoading && prov.sections.isEmpty) {
              return const HomeShimmer();
            }
            if (prov.hasError && prov.sections.isEmpty) {
              return AppErrorWidget(
                message: prov.errorMessage,
                onRetry: prov.refresh,
              );
            }
            return RefreshIndicator(
              color: const Color(AppConstants.primaryColor),
              backgroundColor: const Color(AppConstants.surfaceColor),
              onRefresh: prov.refresh,
              child: CustomScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                slivers: [
                  _buildAppBar(),
                  // Hero banner — gunakan section anime pertama yang punya items
                  () {
                    final heroSection = prov.sections
                        .where((s) =>
                            s.type == 'anime' && s.animeItems.isNotEmpty)
                        .firstOrNull;
                    if (heroSection != null) {
                      return SliverToBoxAdapter(
                        child: _HeroBanner(section: heroSection),
                      );
                    }
                    return const SliverToBoxAdapter(child: SizedBox.shrink());
                  }(),
                  // Render SEMUA sections sebagai row
                  ...prov.sections.map(
                    (s) => SliverToBoxAdapter(
                      child: _SectionWidget(section: s),
                    ),
                  ),
                  const SliverToBoxAdapter(child: SizedBox(height: 24)),
                ],
              ),
            );
          },
        ),
      ),
    );
  }

  SliverAppBar _buildAppBar() {
    return SliverAppBar(
      floating: true,
      snap: true,
      backgroundColor: const Color(AppConstants.bgColor),
      elevation: 0,
      title: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(AppConstants.logoRadius),
            child: Image.asset(
              AppConstants.logoAsset,
              width: 32,
              height: 32,
              fit: BoxFit.cover,
            ),
          ),
          const SizedBox(width: 8),
          const Text('Henkana', style: TextStyle(
            fontFamily: AppConstants.fontFamily,
            color: Color(AppConstants.textPrimary),
            fontSize: 16, fontWeight: FontWeight.w700,
          )),
        ],
      ),
      actions: [
        IconButton(
          icon: const Icon(Icons.search_rounded,
              color: Color(AppConstants.textPrimary)),
          onPressed: () => MainNav.of(context).goTo(MainNav.searchTab),
        ),
      ],
    );
  }
}

// ─── hero banner ──────────────────────────────────────────────────────────────

class _HeroBanner extends StatefulWidget {
  final HomeSection section;
  const _HeroBanner({required this.section});

  @override
  State<_HeroBanner> createState() => _HeroBannerState();
}

class _HeroBannerState extends State<_HeroBanner> {
  final PageController _pageCtrl = PageController();
  int _current = 0;

  List<AnimeItem> get _items =>
      widget.section.animeItems.take(5).toList();

  @override
  void dispose() {
    _pageCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_items.isEmpty) return const SizedBox.shrink();
    return Column(
      children: [
        SizedBox(
          height: 210.0,
          child: PageView.builder(
            controller: _pageCtrl,
            itemCount: _items.length,
            onPageChanged: (i) => setState(() => _current = i),
            itemBuilder: (_, i) => _BannerItem(
              item: _items[i],
              onTap: () => _openDetail(_items[i]),
            ),
          ),
        ),
        const SizedBox(height: 10),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(
            _items.length,
            (i) => AnimatedContainer(
              duration: const Duration(milliseconds: 250),
              margin: const EdgeInsets.symmetric(horizontal: 3),
              width: i == _current ? 18 : 6,
              height: 6,
              decoration: BoxDecoration(
                color: i == _current
                    ? const Color(AppConstants.primaryColor)
                    : const Color(AppConstants.borderColor),
                borderRadius: BorderRadius.circular(3),
              ),
            ),
          ),
        ),
      ],
    );
  }

  void _openDetail(AnimeItem item) {
    switch (_urlType(item.url)) {
      case _UrlType.series:
        Navigator.push(
            context, _fadeRoute(DetailScreen(url: item.url, title: item.title)));
      case _UrlType.manga:
        Navigator.push(
            context,
            _fadeRoute(MangaDetailScreen(url: item.url, title: item.title)));
      case _UrlType.episode:
        Navigator.push(
            context,
            _fadeRoute(WatchScreen(
                url: item.url,
                title: item.title,
                thumbnail: item.thumbnail)));
    }
  }
}

class _BannerItem extends StatelessWidget {
  final AnimeItem item;
  final VoidCallback onTap;
  const _BannerItem({required this.item, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          color: const Color(AppConstants.cardColor),
        ),
        clipBehavior: Clip.hardEdge,
        child: Stack(
          fit: StackFit.expand,
          children: [
            if (item.thumbnail != null)
              Image.network(AppConstants.proxyImage(item.thumbnail!),
                fit: BoxFit.cover,
                alignment: Alignment.topCenter,
                errorBuilder: (_, __, ___) =>
                    Container(color: const Color(AppConstants.cardColor)),
              ),
            // gradient overlay
            Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [Colors.transparent, Colors.black87],
                  stops: [0.4, 1.0],
                ),
              ),
            ),
            Positioned(
              bottom: 14,
              left: 14,
              right: 14,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (item.type != null)
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 3),
                      margin: const EdgeInsets.only(bottom: 6),
                      decoration: BoxDecoration(
                        // black/70 + white/10 border — readable on any image
                        color: Colors.black.withValues(alpha: 0.70),
                        borderRadius: BorderRadius.circular(4),
                        border: Border.all(
                          color: Colors.white.withValues(alpha: 0.25),
                          width: 0.7,
                        ),
                      ),
                      child: Text(
                        item.type!,
                        style: const TextStyle(
                          fontFamily: AppConstants.fontFamily,
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 0.3,
                        ),
                      ),
                    ),
                  Text(
                    item.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      shadows: [
                        Shadow(
                            color: Colors.black,
                            blurRadius: 4,
                            offset: Offset(0, 1))
                      ],
                    ),
                  ),
                  if (item.lastEpisode != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      item.lastEpisode!,
                      style: const TextStyle(
                          color: Colors.white70, fontSize: 11),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── section row ─────────────────────────────────────────────────────────────

class _SectionWidget extends StatefulWidget {
  final HomeSection section;
  const _SectionWidget({required this.section});

  @override
  State<_SectionWidget> createState() => _SectionWidgetState();
}

class _SectionWidgetState extends State<_SectionWidget>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _opacity;
  String _activeTab = '';

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 350),
    )..forward();
    _opacity = CurvedAnimation(parent: _ctrl, curve: Curves.easeIn);
    if (widget.section.tabItems.isNotEmpty) {
      _activeTab = widget.section.tabItems.keys.first;
    }
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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _SectionHeader(
            title: widget.section.title,
            onSeeAll: widget.section.title.contains('Baru')
                ? () => Navigator.push(
                    context, _fadeRoute(const LatestScreen()))
                : null,
          ),
          if (widget.section.type == 'anime-tabs') _buildTabSection(),
          if (widget.section.type == 'anime') _buildAnimeRow(widget.section.animeItems),
          if (widget.section.type == 'manga') _buildMangaRow(widget.section.mangaItems),
        ],
      ),
    );
  }

  Widget _buildTabSection() {
    final tabs = widget.section.tabItems.keys.toList();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          height: 36,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: tabs.length,
            separatorBuilder: (_, __) => const SizedBox(width: 8),
            itemBuilder: (_, i) {
              final t = tabs[i];
              final active = t == _activeTab;
              return GestureDetector(
                onTap: () {
                  if (t == _activeTab) return;
                  setState(() => _activeTab = t);
                },
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 180),
                  curve: Curves.easeOut,
                  padding: const EdgeInsets.symmetric(horizontal: 14),
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: active
                        ? const Color(AppConstants.primaryColor)
                        : Colors.transparent,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: active
                          ? const Color(AppConstants.primaryColor)
                          : const Color(AppConstants.borderStrong),
                    ),
                  ),
                  child: Text(
                    t,
                    style: TextStyle(
                      fontFamily: AppConstants.fontFamily,
                      color: active
                          ? const Color(AppConstants.primaryFgColor)
                          : const Color(AppConstants.textSecondary),
                      fontSize: 12,
                      fontWeight:
                          active ? FontWeight.w700 : FontWeight.w500,
                      letterSpacing: 0.15,
                    ),
                  ),
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 10),
        _buildAnimeRow(widget.section.tabItems[_activeTab] ?? []),
      ],
    );
  }

  Widget _buildAnimeRow(List<AnimeItem> items) {
    if (items.isEmpty) return const SizedBox.shrink();
    return SizedBox(
      height: 210.0,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: items.length,
        separatorBuilder: (_, __) => const SizedBox(width: 10),
        itemBuilder: (_, i) => SizedBox(
          width: 130,
          child: _routedAnimeCard(items[i], context),
        ),
      ),
    );
  }

  Widget _buildMangaRow(List<MangaItem> items) {
    if (items.isEmpty) return const SizedBox.shrink();
    return SizedBox(
      height: 210.0,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: items.length,
        separatorBuilder: (_, __) => const SizedBox(width: 10),
        itemBuilder: (_, i) => SizedBox(
          width: 130,
          child: MangaCard(
            item: items[i],
            onDetailTap: () => Navigator.push(
              context,
              _fadeRoute(MangaDetailScreen(
                  url: items[i].url, title: items[i].title)),
            ),
            onChapterTap: (chUrl) => Navigator.push(
              context,
              _fadeRoute(MangaReaderScreen(
                  url: chUrl, title: items[i].title)),
            ),
          ),
        ),
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  final VoidCallback? onSeeAll;
  const _SectionHeader({required this.title, this.onSeeAll});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 10),
      child: Row(
        children: [
          // w-1.5 h-6 bg-primary rounded-full — 6px wide, 24px tall, pill
          Container(
            width: 6,
            height: 24,
            decoration: BoxDecoration(
              color: const Color(AppConstants.primaryColor),
              borderRadius: BorderRadius.circular(AppConstants.pillRadius),
            ),
          ),
          const SizedBox(width: 10),
          // text-xl font-bold
          Expanded(
            child: Text(
              title,
              style: const TextStyle(
                fontFamily: AppConstants.fontFamily,
                color: Color(AppConstants.textPrimary),
                fontSize: 18,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
          if (onSeeAll != null)
            GestureDetector(
              onTap: onSeeAll,
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'Lihat Semua',
                    style: TextStyle(
                      fontFamily: AppConstants.fontFamily,
                      color: Color(AppConstants.textSecondary),
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  SizedBox(width: 2),
                  Icon(
                    Icons.chevron_right_rounded,
                    size: 16,
                    color: Color(AppConstants.textSecondary),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

// ─── route helper ─────────────────────────────────────────────────────────────

PageRouteBuilder _fadeRoute(Widget page) => PageRouteBuilder(
      pageBuilder: (_, a, __) => page,
      transitionsBuilder: (_, a, __, child) => FadeTransition(
        opacity: a.drive(CurveTween(curve: Curves.easeIn)),
        child: child,
      ),
      transitionDuration: const Duration(milliseconds: 250),
    );
