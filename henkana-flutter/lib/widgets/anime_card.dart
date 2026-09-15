import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../models/anime_item.dart';
import '../utils/constants.dart';

/// Grid card — mirrors Next.js AnimeCard:
///   - Sharp corners (radius 0)
///   - type badge: top-right, black/60 + white/10 border
///   - episode badge: bottom-left, black/70 + white/10 border
///   - status badge: bottom-left next to episode, primary/80 bg
///   - title: text-sm font-bold text-foreground/90, line-clamp-2
class AnimeCard extends StatelessWidget {
  final AnimeItem item;
  final VoidCallback? onTap;
  final VoidCallback? onEpisodeTap;
  final VoidCallback? onDetailTap;

  const AnimeCard({super.key, required this.item, this.onTap, this.onEpisodeTap, this.onDetailTap});

  void _handleTap() {
    onTap?.call();
  }

  void _showPopup(BuildContext context) {
    HapticFeedback.mediumImpact();
    final RenderBox? box = context.findRenderObject() as RenderBox?;
    final Offset? offset = box?.localToGlobal(Offset.zero);
    final Size? size = box?.size;
    showDialog(
      context: context,
      barrierColor: Colors.black.withValues(alpha: 0.4),
      barrierDismissible: true,
      builder: (_) => _AnimePopup(
        item: item,
        anchorOffset: offset,
        anchorSize: size,
        screenSize: MediaQuery.of(context).size,
        onDetailTap: () { Navigator.pop(context); onDetailTap?.call(); },
        onEpisodeTap: () { Navigator.pop(context); onEpisodeTap?.call(); },
      ),
    );
  }

  bool get _showTooltip => onDetailTap != null || onEpisodeTap != null;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: _handleTap,
      onLongPress: _showTooltip ? () => _showPopup(context) : null,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Image area ─────────────────────────────────────────────────
          Expanded(child: _AnimeImage(item: item)),
          const SizedBox(height: 8),
          // ── Title — fixed 2-line height ────────────────────────────────
          SizedBox(
            height: 36,
            child: Text(
              item.title,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontFamily: AppConstants.fontFamily,
                color: Color(AppConstants.textPrimaryDim),
                fontSize: 13,
                fontWeight: FontWeight.w700,
                height: 1.35,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Image with all overlays ──────────────────────────────────────────────────

class _AnimeImage extends StatelessWidget {
  final AnimeItem item;
  const _AnimeImage({required this.item});

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        // Thumbnail — sharp corners (radius 0)
        CachedNetworkImage(
          imageUrl: AppConstants.proxyImage(item.thumbnail ?? ''),
          fit: BoxFit.cover,
          placeholder: (_, __) => Container(color: const Color(AppConstants.mutedColor)),
          errorWidget: (_, __, ___) => Container(
            color: const Color(AppConstants.mutedColor),
            child: const Icon(Icons.image_not_supported_outlined,
                color: Color(AppConstants.textMuted), size: 22),
          ),
        ),

        // Type badge — top right
        // bg-black/60 backdrop-blur border border-white/10 text-white text-xs px-1.5 py-0.5
        if (item.type != null)
          Positioned(
            top: 6, right: 6,
            child: _SharpBadge(
              label: item.type!,
              bgColor: Colors.black.withValues(alpha: 0.60),
              textColor: Colors.white,
              borderColor: Colors.white.withValues(alpha: 0.10),
              fontSize: 10,
            ),
          ),

        // Episode + Status badges — bottom left
        if (item.lastEpisode != null || item.status != null)
          Positioned(
            bottom: 6, left: 6,
            child: Wrap(
              spacing: 4,
              children: [
                if (item.lastEpisode != null)
                  _SharpBadge(
                    label: item.lastEpisode!,
                    bgColor: Colors.black.withValues(alpha: 0.70),
                    textColor: Colors.white,
                    borderColor: Colors.white.withValues(alpha: 0.10),
                    fontSize: 10,
                  ),
                if (item.status != null)
                  _SharpBadge(
                    label: item.status!,
                    // bg-primary/80 → #E8E8E8 at 80%
                    bgColor: const Color(AppConstants.primaryColor).withValues(alpha: 0.80),
                    textColor: const Color(AppConstants.primaryFgColor),
                    fontSize: 10,
                  ),
              ],
            ),
          ),
      ],
    );
  }
}

// ─── Sharp badge (radius 0, matching frontend) ────────────────────────────────

class _SharpBadge extends StatelessWidget {
  final String label;
  final Color bgColor;
  final Color textColor;
  final Color? borderColor;
  final double fontSize;

  const _SharpBadge({
    required this.label,
    required this.bgColor,
    required this.textColor,
    this.borderColor,
    this.fontSize = 10,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: bgColor,
        border: borderColor != null
            ? Border.all(color: borderColor!, width: 0.6)
            : null,
      ),
      child: Text(
        label,
        style: TextStyle(
          fontFamily: AppConstants.fontFamily,
          color: textColor,
          fontSize: fontSize,
          fontWeight: FontWeight.w600,
          height: 1.2,
        ),
      ),
    );
  }
}

// ─── Anime popup ────────────────────────────────────────────────────────────

class _AnimePopup extends StatelessWidget {
  final AnimeItem item;
  final Offset? anchorOffset;
  final Size? anchorSize;
  final Size screenSize;
  final VoidCallback onDetailTap;
  final VoidCallback onEpisodeTap;

  const _AnimePopup({
    required this.item,
    required this.anchorOffset,
    required this.anchorSize,
    required this.screenSize,
    required this.onDetailTap,
    required this.onEpisodeTap,
  });

  @override
  Widget build(BuildContext context) {
    const popupWidth = 220.0;
    const popupMaxHeight = 280.0;

    double left = (anchorOffset?.dx ?? 0) + (anchorSize?.width ?? 0) + 6;
    double top  = (anchorOffset?.dy ?? 0);

    if (left + popupWidth > screenSize.width - 8) {
      left = (anchorOffset?.dx ?? 0) - popupWidth - 6;
    }
    left = left.clamp(8.0, screenSize.width - popupWidth - 8);
    if (top + popupMaxHeight > screenSize.height - 40) {
      top = screenSize.height - popupMaxHeight - 40;
    }
    top = top.clamp(40.0, screenSize.height - popupMaxHeight - 8);

    return Stack(children: [
      Positioned(
        left: left, top: top, width: popupWidth,
        child: Material(
          color: Colors.transparent,
          child: _PopupCard(item: item, onDetailTap: onDetailTap, onEpisodeTap: onEpisodeTap),
        ),
      ),
    ]);
  }
}

class _PopupCard extends StatelessWidget {
  final AnimeItem item;
  final VoidCallback onDetailTap;
  final VoidCallback onEpisodeTap;

  const _PopupCard({required this.item, required this.onDetailTap, required this.onEpisodeTap});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(AppConstants.cardColor),
        border: Border.all(color: const Color(AppConstants.borderColor), width: 0.8),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.5), blurRadius: 16, offset: const Offset(0, 4))],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 10, 8, 8),
            child: Row(children: [
              Expanded(
                child: Text(item.title, maxLines: 2, overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontFamily: AppConstants.fontFamily,
                      color: Color(AppConstants.textPrimary),
                      fontSize: 12, fontWeight: FontWeight.w700, height: 1.3,
                    )),
              ),
              const SizedBox(width: 6),
              GestureDetector(
                onTap: onDetailTap,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  color: const Color(AppConstants.mutedColor),
                  child: const Text('Detail', style: TextStyle(
                    fontFamily: AppConstants.fontFamily,
                    color: Color(AppConstants.textSecondary),
                    fontSize: 10, fontWeight: FontWeight.w600,
                  )),
                ),
              ),
            ]),
          ),
          Container(height: 0.6, color: const Color(AppConstants.borderColor)),
          // Episode button - only show if it has lastEpisode
          if (item.lastEpisode != null)
            GestureDetector(
              onTap: onEpisodeTap,
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                child: Row(children: [
                  const Icon(Icons.play_circle_outline_rounded,
                      color: Color(AppConstants.primaryColor), size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text('Tonton ${item.lastEpisode}',
                        style: const TextStyle(
                          fontFamily: AppConstants.fontFamily,
                          color: Color(AppConstants.textPrimary),
                          fontSize: 12, fontWeight: FontWeight.w600,
                        )),
                  ),
                  const Icon(Icons.chevron_right_rounded,
                      color: Color(AppConstants.textMuted), size: 18),
                ]),
              ),
            ),
          const SizedBox(height: 2),
        ],
      ),
    );
  }
}

// ─── Wide horizontal list tile ────────────────────────────────────────────────

class AnimeListTile extends StatelessWidget {
  final AnimeItem item;
  final VoidCallback? onTap;

  const AnimeListTile({super.key, required this.item, this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 5),
        color: const Color(AppConstants.cardColor),
        child: Row(
          children: [
            // Thumbnail — sharp
            SizedBox(
              width: 80, height: 110,
              child: CachedNetworkImage(
                imageUrl: AppConstants.proxyImage(item.thumbnail ?? ''),
                fit: BoxFit.cover,
                placeholder: (_, __) =>
                    Container(color: const Color(AppConstants.mutedColor)),
                errorWidget: (_, __, ___) => Container(
                  color: const Color(AppConstants.mutedColor),
                  child: const Icon(Icons.image_not_supported_outlined,
                      color: Color(AppConstants.textMuted), size: 20),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontFamily: AppConstants.fontFamily,
                        color: Color(AppConstants.textPrimary),
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 6),
                    if (item.type != null)
                      _SharpBadge(
                        label: item.type!,
                        bgColor: const Color(AppConstants.mutedColor),
                        textColor: const Color(AppConstants.textSecondary),
                        fontSize: 10,
                      ),
                    const SizedBox(height: 4),
                    if (item.lastEpisode != null)
                      Text(item.lastEpisode!,
                          style: const TextStyle(
                            fontFamily: AppConstants.fontFamily,
                            color: Color(AppConstants.textSecondary),
                            fontSize: 11,
                          )),
                    if (item.rating != null) ...[
                      const SizedBox(height: 4),
                      Row(children: [
                        const Icon(Icons.star_rounded,
                            color: Color(AppConstants.amber), size: 12),
                        const SizedBox(width: 3),
                        Text(item.rating!,
                            style: const TextStyle(
                              fontFamily: AppConstants.fontFamily,
                              color: Color(AppConstants.textSecondary),
                              fontSize: 11,
                            )),
                      ]),
                    ],
                  ],
                ),
              ),
            ),
            const SizedBox(width: 12),
          ],
        ),
      ),
    );
  }
}
