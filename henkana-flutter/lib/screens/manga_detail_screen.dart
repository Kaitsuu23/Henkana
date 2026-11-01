import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/manga_provider.dart';
import '../models/manga_detail_data.dart';
import '../utils/prefs.dart';
import '../widgets/shimmer_widgets.dart';
import '../widgets/app_error_widget.dart';
import '../widgets/glass_card.dart';
import '../utils/constants.dart';
import 'manga_reader_screen.dart';
import 'genre_screen.dart';

class MangaDetailScreen extends StatefulWidget {
  final String url;
  final String? title;

  const MangaDetailScreen({super.key, required this.url, this.title});

  @override
  State<MangaDetailScreen> createState() => _MangaDetailScreenState();
}

class _MangaDetailScreenState extends State<MangaDetailScreen> {
  late final MangaDetailProvider _prov;

  @override
  void initState() {
    super.initState();
    _prov = MangaDetailProvider();
    _prov.fetchDetail(widget.url);
  }

  @override
  void dispose() {
    _prov.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider.value(
      value: _prov,
      child: Scaffold(
        backgroundColor: const Color(AppConstants.bgColor),
        body: Consumer<MangaDetailProvider>(
          builder: (_, prov, __) {
            if (prov.isLoading) return const DetailShimmer();
            if (prov.hasError) {
              return Scaffold(
                backgroundColor: const Color(AppConstants.bgColor),
                appBar: AppBar(
                  backgroundColor: const Color(AppConstants.bgColor),
                  title: Text(widget.title ?? 'Detail Manga'),
                ),
                body: AppErrorWidget(
                  message: prov.errorMessage,
                  onRetry: () => prov.retry(widget.url),
                ),
              );
            }
            if (prov.data == null) return const SizedBox.shrink();
            return _MangaDetailBody(data: prov.data!);
          },
        ),
      ),
    );
  }
}

class _MangaDetailBody extends StatefulWidget {
  final MangaDetailData data;
  const _MangaDetailBody({required this.data});

  @override
  State<_MangaDetailBody> createState() => _MangaDetailBodyState();
}

class _MangaDetailBodyState extends State<_MangaDetailBody> {
  bool _reversed = false;

  MangaDetailData get data => widget.data;

  @override
  void initState() {
    super.initState();
    _loadPref();
  }

  Future<void> _loadPref() async {
    final val = await Prefs.getChapterReversed();
    if (mounted) setState(() => _reversed = val);
  }

  Future<void> _toggleReversed() async {
    final next = !_reversed;
    setState(() => _reversed = next);
    await Prefs.setChapterReversed(next);
  }

  @override
  Widget build(BuildContext context) {
    return CustomScrollView(
      slivers: [
        _buildAppBar(context),
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildMeta(),
                const SizedBox(height: 16),
                if (data.synopsis != null) ...[
                  _buildSynopsis(),
                  const SizedBox(height: 16),
                ],
                if (data.genres.isNotEmpty) ...[
          _buildGenreChips(context),
                  const SizedBox(height: 16),
                ],
                _buildInfoRows(),
                const SizedBox(height: 20),
                if (data.chapters.isNotEmpty) _buildChapterList(context),
                const SizedBox(height: 24),
              ],
            ),
          ),
        ),
      ],
    );
  }

  SliverAppBar _buildAppBar(BuildContext context) {
    return SliverAppBar(
      expandedHeight: 280,
      pinned: true,
      backgroundColor: const Color(AppConstants.bgColor),
      foregroundColor: Colors.white,
      flexibleSpace: FlexibleSpaceBar(
        background: Stack(
          fit: StackFit.expand,
          children: [
            if (data.thumbnail != null)
              Image.network(
                AppConstants.proxyImage(data.thumbnail!),
                fit: BoxFit.cover,
                loadingBuilder: (_, child, progress) => progress == null
                    ? child
                    : Container(color: const Color(AppConstants.cardColor)),
                errorBuilder: (_, __, ___) =>
                    Container(color: const Color(AppConstants.cardColor)),
              ),
            Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.black38,
                    Colors.transparent,
                    Color(AppConstants.bgColor)
                  ],
                  stops: [0, 0.5, 1],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMeta() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          data.title,
          style: const TextStyle(
            color: Color(AppConstants.textPrimary),
            fontSize: 20,
            fontWeight: FontWeight.w800,
            height: 1.3,
          ),
        ),
        if (data.altTitle != null) ...[
          const SizedBox(height: 4),
          Text(
            data.altTitle!,
            style: const TextStyle(
              color: Color(AppConstants.textMuted),
              fontSize: 13,
            ),
          ),
        ],
        const SizedBox(height: 10),
        Row(
          children: [
            if (data.type != null) ...[
              _Chip(label: data.type!, color: const Color(0xFF1565C0)),
              const SizedBox(width: 8),
            ],
            if (data.status != null)
              _Chip(
                label: data.status!,
                color: data.status!.toLowerCase() == 'ongoing'
                    ? const Color(0xFF4CAF50)
                    : const Color(AppConstants.textMuted),
              ),
          ],
        ),
      ],
    );
  }

  Widget _buildSynopsis() {
    return _ExpandableSynopsis(text: data.synopsis!);
  }

  Widget _buildGenreChips(BuildContext context) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: data.genres
          .map((g) {
            final name = g['name'] ?? '';
            final slug = (g['url']?.toString() ?? '')
                .split('/')
                .where((s) => s.isNotEmpty)
                .lastOrNull ?? name.toLowerCase().replaceAll(' ', '-');
            return GestureDetector(
              onTap: slug.isNotEmpty
                  ? () => Navigator.push(
                        context,
                        _fadeRoute(GenreScreen(
                          slug: slug,
                          name: name,
                          isManga: true,
                        )),
                      )
                  : null,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: const Color(AppConstants.cardColor),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: const Color(AppConstants.borderColor),
                    width: 0.8,
                  ),
                ),
                child: Text(
                  name,
                  style: const TextStyle(
                    color: Color(AppConstants.textSecondary),
                    fontSize: 11,
                  ),
                ),
              ),
            );
          })
          .toList(),
    );
  }

  Widget _buildInfoRows() {
    final rows = <_InfoRow>[];
    final infoMap = data.info;
    final author = infoMap['authors']?.toString() ?? infoMap['author']?.toString();
    if (author != null) rows.add(_InfoRow('Penulis', author));
    final artist = infoMap['artist']?.toString();
    if (artist != null) rows.add(_InfoRow('Artis', artist));

    if (rows.isEmpty) return const SizedBox.shrink();

    return GlassCard(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      child: Column(
        children: rows
            .map((r) => Padding(
                  padding: const EdgeInsets.symmetric(vertical: 5),
                  child: Row(
                    children: [
                      SizedBox(
                        width: 72,
                        child: Text(
                          r.label,
                          style: const TextStyle(
                            color: Color(AppConstants.textMuted),
                            fontSize: 12,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          r.value,
                          style: const TextStyle(
                            color: Color(AppConstants.textSecondary),
                            fontSize: 12,
                          ),
                        ),
                      ),
                    ],
                  ),
                ))
            .toList(),
      ),
    );
  }

  Widget _buildChapterList(BuildContext context) {
    final chapters = _reversed
        ? data.chapters.reversed.toList()
        : data.chapters;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // -- Header row: label + reverse button --------------------------
        Row(
          children: [
            Container(
              width: 3,
              height: 16,
              decoration: BoxDecoration(
                color: const Color(0xFF1565C0),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(width: 8),
            Text(
              'Chapter (${data.chapterTotal})',
              style: const TextStyle(
                color: Color(AppConstants.textPrimary),
                fontSize: 15,
                fontWeight: FontWeight.w700,
              ),
            ),
            const Spacer(),
            GestureDetector(
              onTap: () => _toggleReversed(),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: const Color(AppConstants.cardColor),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: const Color(AppConstants.borderColor),
                    width: 0.8,
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      _reversed
                          ? Icons.arrow_upward_rounded
                          : Icons.arrow_downward_rounded,
                      size: 12,
                      color: const Color(AppConstants.primaryColor),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      _reversed ? 'Terlama' : 'Terbaru',
                      style: const TextStyle(
                        color: Color(AppConstants.primaryColor),
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        ...chapters.map((ch) => GestureDetector(
              onTap: () => Navigator.push(
                context,
                _fadeRoute(MangaReaderScreen(
                  url: ch.url,
                  title: ch.title,
                )),
              ),
              child: Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding:
                    const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                decoration: BoxDecoration(
                  color: const Color(AppConstants.cardColor),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: const Color(AppConstants.borderColor),
                    width: 0.8,
                  ),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 32,
                      height: 32,
                      decoration: BoxDecoration(
                        color: const Color(0xFF1565C0).withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(Icons.menu_book_rounded,
                          color: Color(0xFF64B5F6), size: 18),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            ch.title,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: Color(AppConstants.textPrimary),
                              fontSize: 13,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          if (ch.date != null)
                            Text(
                              ch.date!,
                              style: const TextStyle(
                                color: Color(AppConstants.textMuted),
                                fontSize: 11,
                              ),
                            ),
                        ],
                      ),
                    ),
                    const Icon(Icons.chevron_right_rounded,
                        color: Color(AppConstants.textMuted), size: 20),
                  ],
                ),
              ),
            )),
      ],
    );
  }
}

// --- helpers -----------------------------------------------------------------

class _ExpandableSynopsis extends StatefulWidget {
  final String text;
  const _ExpandableSynopsis({required this.text});

  @override
  State<_ExpandableSynopsis> createState() => _ExpandableSynopsisState();
}

class _ExpandableSynopsisState extends State<_ExpandableSynopsis> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.only(bottom: 6),
          child: Text(
            'Sinopsis',
            style: TextStyle(
              color: Color(AppConstants.textPrimary),
              fontSize: 14,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
        AnimatedCrossFade(
          duration: const Duration(milliseconds: 250),
          crossFadeState: _expanded
              ? CrossFadeState.showSecond
              : CrossFadeState.showFirst,
          firstChild: Text(
            widget.text,
            maxLines: 4,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: Color(AppConstants.textSecondary),
              fontSize: 13,
              height: 1.6,
            ),
          ),
          secondChild: Text(
            widget.text,
            style: const TextStyle(
              color: Color(AppConstants.textSecondary),
              fontSize: 13,
              height: 1.6,
            ),
          ),
        ),
        GestureDetector(
          onTap: () => setState(() => _expanded = !_expanded),
          child: Padding(
            padding: const EdgeInsets.only(top: 4),
            child: Text(
              _expanded ? 'Lebih sedikit' : 'Baca selengkapnya',
              style: const TextStyle(
                color: Color(0xFF64B5F6),
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _Chip extends StatelessWidget {
  final String label;
  final Color color;
  const _Chip({required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(5),
        border: Border.all(color: color.withValues(alpha: 0.3), width: 0.6),
      ),
      child: Text(
        label,
        style: TextStyle(
            color: color, fontSize: 11, fontWeight: FontWeight.w600),
      ),
    );
  }
}

class _InfoRow {
  final String label;
  final String value;
  const _InfoRow(this.label, this.value);
}

PageRouteBuilder _fadeRoute(Widget page) => PageRouteBuilder(
      pageBuilder: (_, a, __) => page,
      transitionsBuilder: (_, a, __, child) => FadeTransition(
        opacity: a.drive(CurveTween(curve: Curves.easeIn)),
        child: child,
      ),
      transitionDuration: const Duration(milliseconds: 250),
    );
