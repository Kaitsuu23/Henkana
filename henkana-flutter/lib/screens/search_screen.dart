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

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final TextEditingController _input = TextEditingController();
  final ScrollController _scroll = ScrollController();

  @override
  void initState() {
    super.initState();
    _scroll.addListener(_onScroll);
  }

  void _onScroll() {
    if (_scroll.position.pixels >= _scroll.position.maxScrollExtent - 300) {
      context.read<SearchProvider>().loadMore();
    }
  }

  @override
  void dispose() {
    _input.dispose();
    _scroll.dispose();
    super.dispose();
  }

  void _doSearch(String q) {
    context.read<SearchProvider>().search(q, refresh: true);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(AppConstants.bgColor),
      appBar: AppBar(
        backgroundColor: const Color(AppConstants.bgColor),
        titleSpacing: 16,
        title: _SearchBar(
          controller: _input,
          onSubmit: _doSearch,
          onClear: () {
            _input.clear();
            context.read<SearchProvider>().clear();
          },
        ),
      ),
      body: Consumer<SearchProvider>(
        builder: (_, prov, __) {
          // idle / empty query
          if (prov.state == LoadState.idle) {
            return const _EmptyHint();
          }
          // loading first page
          if (prov.isLoading &&
              prov.animeResults.isEmpty &&
              prov.mangaResults.isEmpty) {
            return const ListShimmer();
          }
          // error
          if (prov.hasError &&
              prov.animeResults.isEmpty &&
              prov.mangaResults.isEmpty) {
            return AppErrorWidget(
              message: prov.errorMessage,
              onRetry: () => _doSearch(_input.text),
            );
          }
          // no results
          if (prov.isEmpty) {
            return const _NoResults();
          }

          return CustomScrollView(
            controller: _scroll,
            slivers: [
              // anime results
              if (prov.animeResults.isNotEmpty) ...[
                _sectionHeader('Anime (${prov.animeResults.length})'),
                SliverPadding(
                  padding: const EdgeInsets.symmetric(horizontal: 14),
                  sliver: SliverGrid(
                    gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 3, mainAxisSpacing: 10, crossAxisSpacing: 10, mainAxisExtent: 210.0,
                    ),
                    delegate: SliverChildBuilderDelegate(
                      (_, i) {
                        final item = prov.animeResults[i];
                        return AnimeCard(
                          item: item,
                          onTap: () => Navigator.push(
                            context,
                            _fadeRoute(DetailScreen(
                                url: item.url, title: item.title)),
                          ),
                        );
                      },
                      childCount: prov.animeResults.length,
                    ),
                  ),
                ),
              ],
              // manga results
              if (prov.mangaResults.isNotEmpty) ...[
                _sectionHeader('Manga (${prov.mangaResults.length})'),
                SliverPadding(
                  padding: const EdgeInsets.symmetric(horizontal: 14),
                  sliver: SliverGrid(
                    gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 3, mainAxisSpacing: 10, crossAxisSpacing: 10, mainAxisExtent: 210.0,
                    ),
                    delegate: SliverChildBuilderDelegate(
                      (_, i) {
                        final item = prov.mangaResults[i];
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
                      },
                      childCount: prov.mangaResults.length,
                    ),
                  ),
                ),
              ],
              // load more indicator
              if (prov.isLoading)
                const SliverToBoxAdapter(
                  child: Padding(
                    padding: EdgeInsets.symmetric(vertical: 20),
                    child: Center(
                      child: CircularProgressIndicator(
                        color: Color(AppConstants.primaryColor),
                        strokeWidth: 2,
                      ),
                    ),
                  ),
                ),
              const SliverToBoxAdapter(child: SizedBox(height: 24)),
            ],
          );
        },
      ),
    );
  }

  SliverToBoxAdapter _sectionHeader(String label) {
    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 10),
        child: Row(
          children: [
            Container(
              width: 3,
              height: 14,
              decoration: BoxDecoration(
                color: const Color(AppConstants.primaryColor),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(width: 8),
            Text(
              label,
              style: const TextStyle(
                color: Color(AppConstants.textPrimary),
                fontSize: 14,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// --- search bar ---------------------------------------------------------------

class _SearchBar extends StatefulWidget {
  final TextEditingController controller;
  final void Function(String) onSubmit;
  final VoidCallback onClear;
  const _SearchBar({
    required this.controller,
    required this.onSubmit,
    required this.onClear,
  });

  @override
  State<_SearchBar> createState() => _SearchBarState();
}

class _SearchBarState extends State<_SearchBar> {
  bool _hasText = false;
  bool _isFocused = false;

  @override
  void initState() {
    super.initState();
    widget.controller.addListener(() {
      setState(() => _hasText = widget.controller.text.isNotEmpty);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 44,
      decoration: BoxDecoration(
        color: const Color(AppConstants.cardColor),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
            color: _isFocused
                ? const Color(AppConstants.primaryColor).withValues(alpha: 0.5)
                : const Color(AppConstants.borderColor),
            width: _isFocused ? 1.2 : 0.8),
        boxShadow: _isFocused
            ? [
                BoxShadow(
                  color: const Color(AppConstants.primaryColor).withValues(alpha: 0.15),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ]
            : null,
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(14),
        child: TextField(
          controller: widget.controller,
          autofocus: false,
          textInputAction: TextInputAction.search,
          style: const TextStyle(
              color: Color(AppConstants.textPrimary), fontSize: 15),
          decoration: InputDecoration(
            hintText: 'Cari anime, manga...',
            hintStyle: const TextStyle(
                color: Color(AppConstants.textMuted), fontSize: 15),
            prefixIcon: const Icon(Icons.search_rounded,
                color: Color(AppConstants.textMuted), size: 22),
            suffixIcon: _hasText
                ? GestureDetector(
                    onTap: widget.onClear,
                    child: Container(
                      margin: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.1),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.close_rounded,
                          color: Color(AppConstants.textMuted), size: 16),
                    ),
                  )
                : null,
            border: InputBorder.none,
            enabledBorder: InputBorder.none,
            focusedBorder: InputBorder.none,
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 16,
              vertical: 10,
            ),
            isDense: true,
          ),
          onSubmitted: widget.onSubmit,
          onTap: () => setState(() => _isFocused = true),
          onTapOutside: (_) => setState(() => _isFocused = false),
        ),
      ),
    );
  }
}

// --- empty states -------------------------------------------------------------

class _EmptyHint extends StatelessWidget {
  const _EmptyHint();
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.search_rounded,
            size: 64,
            color: const Color(AppConstants.textMuted).withValues(alpha: 0.4),
          ),
          const SizedBox(height: 16),
          const Text(
            'Ketik untuk mulai mencari',
            style: TextStyle(
                color: Color(AppConstants.textMuted), fontSize: 14),
          ),
        ],
      ),
    );
  }
}

class _NoResults extends StatelessWidget {
  const _NoResults();
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.sentiment_dissatisfied_outlined,
            size: 64,
            color: const Color(AppConstants.textMuted).withValues(alpha: 0.4),
          ),
          const SizedBox(height: 16),
          const Text(
            'Tidak ada hasil',
            style: TextStyle(
                color: Color(AppConstants.textSecondary),
                fontSize: 16,
                fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 6),
          const Text(
            'Coba kata kunci yang berbeda',
            style: TextStyle(
                color: Color(AppConstants.textMuted), fontSize: 13),
          ),
        ],
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
