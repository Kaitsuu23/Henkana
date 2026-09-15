import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/search_provider.dart';
import '../widgets/anime_card.dart';
import '../widgets/manga_card.dart';
import '../widgets/shimmer_widgets.dart';
import '../widgets/app_error_widget.dart';
import '../utils/constants.dart';
import 'detail_screen.dart';
import 'manga_detail_screen.dart';
import 'manga_reader_screen.dart';

class GenreScreen extends StatefulWidget {
  final String slug;
  final String name;
  final bool isManga;

  const GenreScreen({
    super.key,
    required this.slug,
    required this.name,
    this.isManga = false,
  });

  @override
  State<GenreScreen> createState() => _GenreScreenState();
}

class _GenreScreenState extends State<GenreScreen> {
  late final GenreItemsProvider _prov;
  final ScrollController _scroll = ScrollController();

  @override
  void initState() {
    super.initState();
    _prov = GenreItemsProvider();
    _prov.fetch(widget.slug, isManga: widget.isManga, refresh: true);
    _scroll.addListener(_onScroll);
  }

  void _onScroll() {
    if (_scroll.position.pixels >= _scroll.position.maxScrollExtent - 300) {
      _prov.loadMore(widget.slug);
    }
  }

  @override
  void dispose() {
    _prov.dispose();
    _scroll.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider.value(
      value: _prov,
      child: Scaffold(
        backgroundColor: const Color(AppConstants.bgColor),
        appBar: AppBar(
          backgroundColor: const Color(AppConstants.bgColor),
          title: Text(widget.name),
        ),
        body: Consumer<GenreItemsProvider>(
          builder: (_, prov, __) {
            if (prov.isLoading &&
                prov.animeItems.isEmpty &&
                prov.mangaItems.isEmpty) {
              return const GridShimmer();
            }
            if (prov.hasError &&
                prov.animeItems.isEmpty &&
                prov.mangaItems.isEmpty) {
              return AppErrorWidget(
                message: prov.errorMessage,
                onRetry: () => _prov.fetch(
                  widget.slug,
                  isManga: widget.isManga,
                  refresh: true,
                ),
              );
            }

            final items = widget.isManga ? prov.mangaItems : prov.animeItems;
            final loadingMore = prov.isLoading && items.isNotEmpty;

            return RefreshIndicator(
              color: const Color(AppConstants.primaryColor),
              backgroundColor: const Color(AppConstants.surfaceColor),
              onRefresh: () =>
                  _prov.fetch(widget.slug, isManga: widget.isManga, refresh: true),
              child: GridView.builder(
                controller: _scroll,
                padding: const EdgeInsets.all(14),
                physics: const AlwaysScrollableScrollPhysics(),
                gridDelegate:
                    const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 3, mainAxisSpacing: 10, crossAxisSpacing: 10,
                  // manga cards are taller due to chapter chips
                  mainAxisExtent: 210.0,
                ),
                itemCount: items.length + (loadingMore ? 3 : 0),
                itemBuilder: (_, i) {
                  if (i >= items.length) {
                    return const ShimmerBox(
                      width: double.infinity,
                      height: 265.0,
                      borderRadius: 10,
                    );
                  }
                  if (widget.isManga) {
                    final item = prov.mangaItems[i];
                    return MangaCard(
                      item: item,
                      onDetailTap: () => Navigator.push(
                        context,
                        _fadeRoute(MangaDetailScreen(
                            url: item.url, title: item.title)),
                      ),
                      onChapterTap: (chUrl) => Navigator.push(
                        context,
                        _fadeRoute(MangaReaderScreen(
                            url: chUrl, title: item.title)),
                      ),
                    );
                  } else {
                    final item = prov.animeItems[i];
                    return AnimeCard(
                      item: item,
                      onTap: () => Navigator.push(
                        context,
                        _fadeRoute(
                            DetailScreen(url: item.url, title: item.title)),
                      ),
                    );
                  }
                },
              ),
            );
          },
        ),
      ),
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
