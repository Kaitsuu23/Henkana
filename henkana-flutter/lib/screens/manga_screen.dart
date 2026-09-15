import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/manga_provider.dart';
import '../widgets/manga_card.dart';
import '../widgets/shimmer_widgets.dart';
import '../widgets/app_error_widget.dart';
import '../widgets/pill_tab_bar.dart';
import '../utils/constants.dart';
import 'manga_detail_screen.dart';
import 'manga_reader_screen.dart';

const double _kCardHeight = 210.0;
const double _kGridPadding = 12.0;
const double _kGridSpacing = 10.0;
const int _kGridColumns = 3;

class MangaScreen extends StatefulWidget {
  const MangaScreen({super.key});

  @override
  State<MangaScreen> createState() => _MangaScreenState();
}

class _MangaScreenState extends State<MangaScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabCtrl;

  // Doujinshi moved here from anime screen
  final List<String> _tabs = ['Manga', 'Manhwa', 'Doujinshi'];
  final List<String> _endpoints = ['manga', 'manhwa', 'doujinshi'];
  final List<MangaListProvider> _providers = [];

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(length: _tabs.length, vsync: this);
    for (final ep in _endpoints) {
      _providers.add(MangaListProvider(endpoint: ep));
    }
    _providers[0].fetch();
    _tabCtrl.addListener(() {
      if (!_tabCtrl.indexIsChanging) {
        final p = _providers[_tabCtrl.index];
        if (p.state == LoadState.idle) p.fetch();
      }
    });
  }

  @override
  void dispose() {
    _tabCtrl.dispose();
    for (final p in _providers) {
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
        title: const Text('Manga'),
        bottom: PillTabBar(
          controller: _tabCtrl,
          tabs: _tabs,
        ),
      ),
      body: TabBarView(
        controller: _tabCtrl,
        children: List.generate(
          _tabs.length,
          (i) => ChangeNotifierProvider.value(
            value: _providers[i],
            child: const _MangaTabBody(),
          ),
        ),
      ),
    );
  }
}

class _MangaTabBody extends StatefulWidget {
  const _MangaTabBody();
  @override
  State<_MangaTabBody> createState() => _MangaTabBodyState();
}

class _MangaTabBodyState extends State<_MangaTabBody>
    {
  final ScrollController _scroll = ScrollController();
@override
  void initState() {
    super.initState();
    _scroll.addListener(_onScroll);
  }

  void _onScroll() {
    if (_scroll.position.pixels >= _scroll.position.maxScrollExtent - 300) {
      context.read<MangaListProvider>().loadMore();
    }
  }

  @override
  void dispose() {
    _scroll.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
return Consumer<MangaListProvider>(
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
                  borderRadius: 10,
                );
              }
              final item = prov.items[i];
              return _AnimatedCard(
                index: i,
                child: MangaCard(
                  item: item,
                  onDetailTap: () => Navigator.push(
                    context,
                    _fadeRoute(
                        MangaDetailScreen(url: item.url, title: item.title)),
                  ),
                  onChapterTap: (chUrl) => Navigator.push(
                    context,
                    _fadeRoute(MangaReaderScreen(url: chUrl, title: item.title)),
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
