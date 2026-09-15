import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../providers/search_provider.dart';
import '../models/genre_item.dart';
import '../widgets/shimmer_widgets.dart';
import '../widgets/app_error_widget.dart';
import '../utils/constants.dart';
import 'genre_screen.dart';

/// Genre list — popular tiles + A–Z rows, with live filter.
class GenreListScreen extends StatefulWidget {
  const GenreListScreen({super.key});

  @override
  State<GenreListScreen> createState() => _GenreListScreenState();
}

class _GenreListScreenState extends State<GenreListScreen> {
  late final GenreProvider _provider;
  final _filter = TextEditingController();
  String _query = '';

  @override
  void initState() {
    super.initState();
    _provider = GenreProvider(isManga: false);
    _provider.fetchGenres();
    _filter.addListener(() {
      final q = _filter.text.trim().toLowerCase();
      if (q != _query) setState(() => _query = q);
    });
  }

  @override
  void dispose() {
    _filter.dispose();
    _provider.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider.value(
      value: _provider,
      child: Scaffold(
        backgroundColor: const Color(AppConstants.bgColor),
        appBar: AppBar(
          backgroundColor: const Color(AppConstants.bgColor),
          title: const Text('Genre'),
        ),
        body: Consumer<GenreProvider>(
          builder: (_, prov, __) {
            if (prov.isLoading) return const _GenreShimmer();
            if (prov.hasError) {
              return AppErrorWidget(
                message: prov.errorMessage,
                onRetry: () => prov.fetchGenres(refresh: true),
              );
            }
            if (prov.genres.isEmpty) {
              return const Center(
                child: Text(
                  'Tidak ada genre',
                  style: TextStyle(color: Color(AppConstants.textMuted)),
                ),
              );
            }

            final all = [...prov.genres]
              ..sort((a, b) => a.name.toLowerCase().compareTo(b.name.toLowerCase()));
            final popular = [...prov.genres]
              ..sort((a, b) => (b.count ?? 0).compareTo(a.count ?? 0));
            final top = popular.take(4).toList();

            final filtered = _query.isEmpty
                ? all
                : all
                    .where((g) => g.name.toLowerCase().contains(_query))
                    .toList();

            final groups = <String, List<GenreItem>>{};
            for (final g in filtered) {
              groups.putIfAbsent(_letter(g.name), () => []).add(g);
            }
            final letters = groups.keys.toList()
              ..sort((a, b) {
                if (a == '#') return -1;
                if (b == '#') return 1;
                return a.compareTo(b);
              });

            return RefreshIndicator(
              color: const Color(AppConstants.primaryColor),
              backgroundColor: const Color(AppConstants.surfaceColor),
              onRefresh: () => prov.fetchGenres(refresh: true),
              child: CustomScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                slivers: [
                  SliverToBoxAdapter(child: _FilterBar(controller: _filter)),
                  if (_query.isEmpty && top.any((g) => (g.count ?? 0) > 0)) ...[
                    const SliverToBoxAdapter(
                      child: _SectionLabel('Populer'),
                    ),
                    SliverPadding(
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
                      sliver: SliverGrid(
                        gridDelegate:
                            const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          mainAxisSpacing: 8,
                          crossAxisSpacing: 8,
                          mainAxisExtent: 42,
                        ),
                        delegate: SliverChildBuilderDelegate(
                          (_, i) => _PopularTile(
                            genre: top[i],
                            featured: i == 0,
                            onTap: () => _open(top[i]),
                          ),
                          childCount: top.length,
                        ),
                      ),
                    ),
                  ],
                  if (filtered.isEmpty)
                    const SliverFillRemaining(
                      hasScrollBody: false,
                      child: Center(
                        child: Text(
                          'Tidak ada genre yang cocok',
                          style: TextStyle(
                            color: Color(AppConstants.textMuted),
                            fontSize: 14,
                          ),
                        ),
                      ),
                    )
                  else ...[
                    if (_query.isEmpty)
                      const SliverToBoxAdapter(
                        child: _SectionLabel('Semua'),
                      ),
                    for (final letter in letters) ...[
                      SliverToBoxAdapter(child: _LetterHeader(letter)),
                      SliverPadding(
                        padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                        sliver: SliverList(
                          delegate: SliverChildBuilderDelegate(
                            (_, i) {
                              final items = groups[letter]!;
                              return _GenreRow(
                                genre: items[i],
                                isFirst: i == 0,
                                isLast: i == items.length - 1,
                                onTap: () => _open(items[i]),
                              );
                            },
                            childCount: groups[letter]!.length,
                          ),
                        ),
                      ),
                    ],
                  ],
                  const SliverToBoxAdapter(child: SizedBox(height: 24)),
                ],
              ),
            );
          },
        ),
      ),
    );
  }

  void _open(GenreItem genre) {
    HapticFeedback.selectionClick();
    Navigator.push(
      context,
      PageRouteBuilder(
        pageBuilder: (_, a, __) => GenreScreen(
          slug: genre.slug,
          name: genre.name,
          isManga: false,
        ),
        transitionsBuilder: (_, a, __, child) => FadeTransition(
          opacity: a.drive(CurveTween(curve: Curves.easeIn)),
          child: child,
        ),
        transitionDuration: const Duration(milliseconds: 250),
      ),
    );
  }

  static String _letter(String name) {
    if (name.isEmpty) return '#';
    final c = name[0].toUpperCase();
    return RegExp(r'[A-Z]').hasMatch(c) ? c : '#';
  }
}

class _FilterBar extends StatelessWidget {
  final TextEditingController controller;
  const _FilterBar({required this.controller});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 12),
      child: TextField(
        controller: controller,
        textInputAction: TextInputAction.search,
        style: const TextStyle(
          color: Color(AppConstants.textPrimary),
          fontSize: 14,
        ),
        decoration: InputDecoration(
          hintText: 'Cari genre...',
          hintStyle: const TextStyle(
            color: Color(AppConstants.textMuted),
            fontSize: 14,
          ),
          prefixIcon: const Icon(
            Icons.search_rounded,
            color: Color(AppConstants.textMuted),
            size: 20,
          ),
          filled: true,
          fillColor: const Color(AppConstants.cardColor),
          contentPadding: const EdgeInsets.symmetric(vertical: 10),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: const BorderSide(color: Color(AppConstants.borderColor)),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: const BorderSide(color: Color(AppConstants.borderColor)),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: const BorderSide(
              color: Color(AppConstants.primaryColor),
              width: 1.2,
            ),
          ),
        ),
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  final String text;
  const _SectionLabel(this.text);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 10),
      child: Text(
        text.toUpperCase(),
        style: const TextStyle(
          fontFamily: AppConstants.fontFamily,
          color: Color(AppConstants.textMuted),
          fontSize: 11,
          fontWeight: FontWeight.w700,
          letterSpacing: 1.4,
        ),
      ),
    );
  }
}

class _LetterHeader extends StatelessWidget {
  final String letter;
  const _LetterHeader(this.letter);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 6),
      child: Text(
        letter,
        style: const TextStyle(
          fontFamily: AppConstants.fontFamily,
          color: Color(AppConstants.primaryColor),
          fontSize: 13,
          fontWeight: FontWeight.w800,
          letterSpacing: 0.5,
        ),
      ),
    );
  }
}

class _PopularTile extends StatelessWidget {
  final GenreItem genre;
  final bool featured;
  final VoidCallback onTap;
  const _PopularTile({
    required this.genre,
    required this.featured,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final fg = featured
        ? const Color(AppConstants.primaryFgColor)
        : const Color(AppConstants.textPrimary);
    final muted = featured
        ? const Color(AppConstants.primaryFgColor).withValues(alpha: 0.55)
        : const Color(AppConstants.textMuted);

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12),
        decoration: BoxDecoration(
          color: featured
              ? const Color(AppConstants.primaryColor)
              : const Color(AppConstants.cardColor),
          borderRadius: BorderRadius.circular(8),
          border: featured
              ? null
              : Border.all(color: const Color(AppConstants.borderColor)),
        ),
        child: Row(
          children: [
            Expanded(
              child: Text(
                genre.name,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontFamily: AppConstants.fontFamily,
                  color: fg,
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
            const SizedBox(width: 6),
            Text(
              '${genre.count ?? 0}',
              style: TextStyle(
                fontFamily: AppConstants.fontFamily,
                color: muted,
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _GenreRow extends StatelessWidget {
  final GenreItem genre;
  final bool isFirst;
  final bool isLast;
  final VoidCallback onTap;
  const _GenreRow({
    required this.genre,
    required this.isFirst,
    required this.isLast,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final radius = BorderRadius.vertical(
      top: isFirst ? const Radius.circular(12) : Radius.zero,
      bottom: isLast ? const Radius.circular(12) : Radius.zero,
    );
    return Material(
      color: const Color(AppConstants.cardColor),
      borderRadius: radius,
      child: InkWell(
        onTap: onTap,
        borderRadius: radius,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
          decoration: BoxDecoration(
            border: isLast
                ? null
                : const Border(
                    bottom: BorderSide(
                      color: Color(AppConstants.borderColor),
                      width: 0.6,
                    ),
                  ),
          ),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  genre.name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontFamily: AppConstants.fontFamily,
                    color: Color(AppConstants.textPrimary),
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              if (genre.count != null)
                Text(
                  '${genre.count}',
                  style: const TextStyle(
                    color: Color(AppConstants.textMuted),
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    fontFeatures: [FontFeature.tabularFigures()],
                  ),
                ),
              const SizedBox(width: 6),
              const Icon(
                Icons.chevron_right_rounded,
                size: 18,
                color: Color(AppConstants.textMuted),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _GenreShimmer extends StatelessWidget {
  const _GenreShimmer();

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
      physics: const NeverScrollableScrollPhysics(),
      children: [
        const ShimmerBox(width: double.infinity, height: 44, borderRadius: 10),
        const SizedBox(height: 20),
        const ShimmerBox(width: 64, height: 12, borderRadius: 4),
        const SizedBox(height: 12),
        const Row(
          children: [
            Expanded(
              child: ShimmerBox(
                width: double.infinity,
                height: 42,
                borderRadius: 8,
              ),
            ),
            SizedBox(width: 8),
            Expanded(
              child: ShimmerBox(
                width: double.infinity,
                height: 42,
                borderRadius: 8,
              ),
            ),
          ],
        ),
        const SizedBox(height: 24),
        const ShimmerBox(width: 48, height: 12, borderRadius: 4),
        const SizedBox(height: 12),
        ...List.generate(
          8,
          (_) => const Padding(
            padding: EdgeInsets.only(bottom: 8),
            child: ShimmerBox(
              width: double.infinity,
              height: 44,
              borderRadius: 8,
            ),
          ),
        ),
      ],
    );
  }
}
