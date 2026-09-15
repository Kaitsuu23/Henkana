import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:provider/provider.dart';
import '../providers/anime_provider.dart';
import '../widgets/video_card.dart';
import '../widgets/shimmer_widgets.dart';
import '../widgets/app_error_widget.dart';
import '../utils/constants.dart';
import 'detail_screen.dart';

class WatchScreen extends StatefulWidget {
  final String url;
  final String? title;
  final String? thumbnail;

  const WatchScreen({super.key, required this.url, this.title, this.thumbnail});

  @override
  State<WatchScreen> createState() => _WatchScreenState();
}

class _WatchScreenState extends State<WatchScreen> {
  late final WatchProvider _prov;
  String? _currentUrl;
  bool _isFullscreen = false;
  final GlobalKey<VideoCardState> _playerKey = GlobalKey<VideoCardState>();

  @override
  void initState() {
    super.initState();
    _prov = WatchProvider();
    _currentUrl = widget.url;
    _prov.fetchWatch(widget.url);
  }

  @override
  void dispose() {
    _prov.dispose();
    _exitFullscreen();
    super.dispose();
  }

  void _toggleFullscreen() {
    if (_isFullscreen) {
      _exitFullscreen();
    } else {
      SystemChrome.setPreferredOrientations([
        DeviceOrientation.landscapeLeft,
        DeviceOrientation.landscapeRight,
      ]);
    }
    setState(() => _isFullscreen = !_isFullscreen);
  }

  void _exitFullscreen() {
    SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
  }

  void _navigateTo(String url) {
    if (url.isEmpty) return;
    // Reset player state before navigating to next/prev episode
    _playerKey.currentState?.resetPlayer();
    setState(() => _currentUrl = url);
    _prov.fetchWatch(url);
  }

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider.value(
      value: _prov,
      child: Scaffold(
        backgroundColor: const Color(AppConstants.bgColor),
        body: Consumer<WatchProvider>(
          builder: (_, prov, __) {
            return Stack(children: [
              // Background blurred thumbnail
              if (widget.thumbnail != null)
                Positioned.fill(
                  child: Opacity(
                    opacity: 0.08,
                    child: CachedNetworkImage(
                      imageUrl: AppConstants.proxyImage(widget.thumbnail!),
                      fit: BoxFit.cover,
                      errorWidget: (_, __, ___) => const SizedBox(),
                      placeholder: (_, __) => const SizedBox(),
                    ),
                  ),
                ),

              Positioned.fill(
                child: LayoutBuilder(
                  builder: (context, constraints) {
                    return Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        // ── Player ────────────────────────────────────────────────
                        _buildPlayerArea(prov),

                        // ── Content (portrait only) ────────────────────────────
                        if (!_isFullscreen)
                          Expanded(
                            child: Container(
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  begin: Alignment.topCenter,
                                  end: Alignment.bottomCenter,
                                  colors: [
                                    Colors.black.withValues(alpha: 0.85),
                                    Colors.black,
                                  ],
                                ),
                              ),
                              child: _buildContent(prov),
                            ),
                          ),
                      ],
                    );
                  },
                ),
              ),
            ]);
          },
        ),
      ),
    );
  }

  Widget _buildPlayerArea(WatchProvider prov) {
    if (_isFullscreen) {
      return Expanded(
        child: VideoCard(
          key: _playerKey,
          videoUrl: prov.currentStreamUrl,
          title: prov.data?.title ?? widget.title,
          thumbnail: prov.data?.thumbnail ?? widget.thumbnail,
          qualities: prov.data?.streams
                  .map((s) => {'label': s.quality, 'url': s.hlsUrl})
                  .toList() ??
              [],
          selectedQualityIndex: prov.selectedQualityIndex,
          onQualityChanged: prov.selectQuality,
          hasPrev: prov.data?.prevUrl != null,
          hasNext: prov.data?.nextUrl != null,
          onPrev: prov.data?.prevUrl != null
              ? () => _navigateTo(prov.data!.prevUrl!)
              : null,
          onNext: prov.data?.nextUrl != null
              ? () => _navigateTo(prov.data!.nextUrl!)
              : null,
          isFullscreen: true,
          onFullscreen: _toggleFullscreen,
        ),
      );
    }

    final top = MediaQuery.viewPaddingOf(context).top;

    Widget player;
    if (prov.isLoading) {
      player = const ColoredBox(color: Colors.black, child: WatchShimmer());
    } else if (prov.hasError) {
      player = ColoredBox(
        color: Colors.black,
        child: AppErrorWidget(
          message: prov.errorMessage,
          onRetry: () => prov.retry(_currentUrl ?? widget.url),
        ),
      );
    } else {
      player = VideoCard(
        key: _playerKey,
        videoUrl: prov.currentStreamUrl,
        title: prov.data?.title ?? widget.title,
        thumbnail: prov.data?.thumbnail ?? widget.thumbnail,
        qualities: prov.data?.streams
                .map((s) => {'label': s.quality, 'url': s.hlsUrl})
                .toList() ??
            [],
        selectedQualityIndex: prov.selectedQualityIndex,
        onQualityChanged: prov.selectQuality,
        hasPrev: prov.data?.prevUrl != null,
        hasNext: prov.data?.nextUrl != null,
        onPrev: prov.data?.prevUrl != null
            ? () => _navigateTo(prov.data!.prevUrl!)
            : null,
        onNext: prov.data?.nextUrl != null
            ? () => _navigateTo(prov.data!.nextUrl!)
            : null,
        isFullscreen: false,
        onFullscreen: _toggleFullscreen,
      );
    }

    return ColoredBox(
      color: Colors.black,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(height: top),
          AspectRatio(aspectRatio: 16 / 9, child: player),
        ],
      ),
    );
  }

  Widget _buildContent(WatchProvider prov) {
    if (prov.isLoading) return const SizedBox.shrink();
    if (prov.hasError) return const SizedBox.shrink();
    if (prov.data == null) return const SizedBox.shrink();

    final data = prov.data!;
    final thumb = data.thumbnail ?? widget.thumbnail;

    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 100),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(
          data.title ?? widget.title ?? '',
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.w800,
            height: 1.25,
          ),
        ),

        if (data.seriesUrl != null && data.seriesUrl!.isNotEmpty) ...[
          const SizedBox(height: 16),
          _SeriesCard(
            title: data.seriesTitle ?? 'Series',
            thumbnail: thumb,
            onTap: () => Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => DetailScreen(
                  url: data.seriesUrl!,
                  title: data.seriesTitle,
                ),
              ),
            ),
          ),
        ],

        if (data.streams.length > 1) ...[
          const SizedBox(height: 20),
          const Text(
            'KUALITAS',
            style: TextStyle(
              color: Color(AppConstants.textMuted),
              fontSize: 11,
              fontWeight: FontWeight.w700,
              letterSpacing: 1.2,
            ),
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: List.generate(data.streams.length, (i) {
              final sel = i == prov.selectedQualityIndex;
              return GestureDetector(
                onTap: () => prov.selectQuality(i),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 180),
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: sel
                        ? const Color(AppConstants.primaryColor)
                        : const Color(AppConstants.cardColor),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: sel
                          ? const Color(AppConstants.primaryColor)
                          : const Color(AppConstants.borderColor),
                    ),
                  ),
                  child: Text(
                    data.streams[i].quality,
                    style: TextStyle(
                      color: sel
                          ? const Color(AppConstants.primaryFgColor)
                          : const Color(AppConstants.textSecondary),
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              );
            }),
          ),
        ],

        const SizedBox(height: 20),
        Row(children: [
          Expanded(
            child: _NavBtn(
              icon: Icons.skip_previous_rounded,
              label: 'Sebelumnya',
              onTap: data.prevUrl != null
                  ? () => _navigateTo(data.prevUrl!)
                  : null,
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: _NavBtn(
              icon: Icons.skip_next_rounded,
              label: 'Selanjutnya',
              isNext: true,
              onTap: data.nextUrl != null
                  ? () => _navigateTo(data.nextUrl!)
                  : null,
            ),
          ),
        ]),
      ]),
    );
  }
}

// ─── Nav button ───────────────────────────────────────────────────────────────

class _SeriesCard extends StatelessWidget {
  final String title;
  final String? thumbnail;
  final VoidCallback onTap;

  const _SeriesCard({
    required this.title,
    required this.thumbnail,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: const Color(AppConstants.cardColor),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(AppConstants.borderColor)),
        ),
        child: Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: thumbnail != null
                  ? CachedNetworkImage(
                      imageUrl: AppConstants.proxyImage(thumbnail),
                      width: 52,
                      height: 72,
                      fit: BoxFit.cover,
                      errorWidget: (_, __, ___) => const _ThumbFallback(),
                    )
                  : const _ThumbFallback(),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'SERIES',
                    style: TextStyle(
                      color: Color(AppConstants.textMuted),
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 1.1,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Color(AppConstants.textPrimary),
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      height: 1.25,
                    ),
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'Lihat semua episode',
                    style: TextStyle(
                      color: Color(AppConstants.primaryColor),
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right_rounded,
                color: Color(AppConstants.textMuted), size: 22),
          ],
        ),
      ),
    );
  }
}

class _ThumbFallback extends StatelessWidget {
  const _ThumbFallback();
  @override
  Widget build(BuildContext context) {
    return Container(
      width: 52,
      height: 72,
      color: const Color(AppConstants.mutedColor),
      child: const Icon(Icons.movie_outlined,
          color: Color(AppConstants.textMuted), size: 20),
    );
  }
}

class _NavBtn extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback? onTap;
  final bool isNext;

  const _NavBtn({
    required this.icon,
    required this.label,
    required this.onTap,
    this.isNext = false,
  });

  @override
  Widget build(BuildContext context) {
    final enabled = onTap != null;
    return Opacity(
      opacity: enabled ? 1 : 0.38,
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.06),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isNext && enabled
                  ? const Color(AppConstants.primaryColor).withValues(alpha: 0.4)
                  : Colors.white.withValues(alpha: 0.08),
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: isNext
                ? [
                    Flexible(
                        child: Text(label,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                                color: enabled
                                    ? const Color(AppConstants.primaryColor)
                                    : Colors.white54,
                                fontSize: 13,
                                fontWeight: FontWeight.w700))),
                    const SizedBox(width: 8),
                    Icon(icon,
                        color: enabled
                            ? const Color(AppConstants.primaryColor)
                            : Colors.white54,
                        size: 18),
                  ]
                : [
                    Icon(icon, color: Colors.white54, size: 18),
                    const SizedBox(width: 8),
                    Flexible(
                        child: Text(label,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                                color: Colors.white54,
                                fontSize: 13,
                                fontWeight: FontWeight.w600))),
                  ],
          ),
        ),
      ),
    );
  }
}
