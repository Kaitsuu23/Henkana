import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../models/manga_item.dart';
import '../utils/constants.dart';

/// Grid card — mirrors Next.js MangaCard:
///   - Sharp corners (radius 0)
///   - Manga type badge: bottom-right, bg-red-700 (#B91C1C), sharp
///   - Title: text-sm font-bold text-foreground/90
///   - Tap → reader (latest chapter) / Long press → chapter popup
class MangaCard extends StatelessWidget {
  final MangaItem item;
  final void Function(String chapterUrl)? onChapterTap;
  final VoidCallback? onDetailTap;

  const MangaCard({
    super.key,
    required this.item,
    this.onChapterTap,
    this.onDetailTap,
  });

  void _handleTap() {
    if (item.latestChapters.isNotEmpty) {
      final url = item.latestChapters.first.url;
      if (url.isNotEmpty) {
        onChapterTap?.call(url);
        return;
      }
    }
    onDetailTap?.call();
  }

  void _showChapterPopup(BuildContext context) {
    if (item.latestChapters.isEmpty) { onDetailTap?.call(); return; }
    HapticFeedback.mediumImpact();
    final RenderBox? box = context.findRenderObject() as RenderBox?;
    final Offset? offset = box?.localToGlobal(Offset.zero);
    final Size? size = box?.size;
    showDialog(
      context: context,
      barrierColor: Colors.black.withValues(alpha: 0.4),
      barrierDismissible: true,
      builder: (_) => _ChapterPopup(
        item: item,
        anchorOffset: offset,
        anchorSize: size,
        screenSize: MediaQuery.of(context).size,
        onChapterTap: (url) { Navigator.pop(context); onChapterTap?.call(url); },
        onDetailTap: () { Navigator.pop(context); onDetailTap?.call(); },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: _handleTap,
      onLongPress: () => _showChapterPopup(context),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Image area ─────────────────────────────────────────────────
          Expanded(child: _MangaImage(item: item)),
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

// ─── Image with badges ────────────────────────────────────────────────────────

class _MangaImage extends StatelessWidget {
  final MangaItem item;
  const _MangaImage({required this.item});

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        Image.network(
          AppConstants.proxyImage(item.thumbnail ?? ''),
          fit: BoxFit.cover,
          loadingBuilder: (_, child, progress) => progress == null
              ? child
              : Container(color: const Color(AppConstants.mutedColor)),
          errorBuilder: (_, __, ___) => Container(
            color: const Color(AppConstants.mutedColor),
            child: const Icon(Icons.image_not_supported_outlined,
                color: Color(AppConstants.textMuted), size: 22),
          ),
        ),

        // Type badge — bottom right, bg-red-700, sharp
        if (item.type != null)
          Positioned(
            bottom: 6, right: 6,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              color: const Color(AppConstants.mangaBadgeRed),
              child: Text(
                item.type!.toUpperCase(),
                style: const TextStyle(
                  fontFamily: AppConstants.fontFamily,
                  color: Colors.white,
                  fontSize: 9,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.5,
                ),
              ),
            ),
          ),
      ],
    );
  }
}

// ─── Chapter popup ────────────────────────────────────────────────────────────

class _ChapterPopup extends StatelessWidget {
  final MangaItem item;
  final Offset? anchorOffset;
  final Size? anchorSize;
  final Size screenSize;
  final void Function(String url) onChapterTap;
  final VoidCallback onDetailTap;

  const _ChapterPopup({
    required this.item,
    required this.anchorOffset,
    required this.anchorSize,
    required this.screenSize,
    required this.onChapterTap,
    required this.onDetailTap,
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
          child: _PopupCard(item: item, onChapterTap: onChapterTap, onDetailTap: onDetailTap),
        ),
      ),
    ]);
  }
}

class _PopupCard extends StatelessWidget {
  final MangaItem item;
  final void Function(String url) onChapterTap;
  final VoidCallback onDetailTap;

  const _PopupCard({required this.item, required this.onChapterTap, required this.onDetailTap});

  @override
  Widget build(BuildContext context) {
    final chapters = item.latestChapters;
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
          // Chapters
          if (chapters.isEmpty)
            const Padding(
              padding: EdgeInsets.all(12),
              child: Text('Tidak ada chapter',
                  style: TextStyle(fontFamily: AppConstants.fontFamily,
                      color: Color(AppConstants.textMuted), fontSize: 11)),
            )
          else
            ...chapters.take(5).map((ch) => GestureDetector(
              onTap: ch.url.isNotEmpty ? () => onChapterTap(ch.url) : null,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
                // bg-muted chapter row style
                color: const Color(AppConstants.mutedColor).withValues(alpha: 0),
                child: Row(children: [
                  Expanded(
                    child: Row(children: [
                      Flexible(
                        child: Text(ch.chapter, maxLines: 1, overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              fontFamily: AppConstants.fontFamily,
                              color: Color(AppConstants.textPrimary),
                              fontSize: 12, fontWeight: FontWeight.w600,
                            )),
                      ),
                      if (ch.badge != null) ...[
                        const SizedBox(width: 6),
                        // bg-primary/20 text-primary (near-white)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                          color: const Color(AppConstants.primaryColor).withValues(alpha: 0.15),
                          child: Text(ch.badge!, style: const TextStyle(
                            fontFamily: AppConstants.fontFamily,
                            color: Color(AppConstants.primaryColor),
                            fontSize: 9, fontWeight: FontWeight.w700,
                          )),
                        ),
                      ],
                    ]),
                  ),
                  if (ch.date != null) ...[
                    const SizedBox(width: 8),
                    Text(ch.date!, style: const TextStyle(
                      fontFamily: AppConstants.fontFamily,
                      color: Color(AppConstants.textSecondary), fontSize: 10,
                    )),
                  ],
                ]),
              ),
            )),
          // See all
          if (chapters.length > 5)
            GestureDetector(
              onTap: onDetailTap,
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 8),
                decoration: const BoxDecoration(
                  border: Border(top: BorderSide(color: Color(AppConstants.borderColor), width: 0.5)),
                ),
                child: Text(
                  'Lihat semua ${chapters.length} chapter →',
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontFamily: AppConstants.fontFamily,
                    color: Color(AppConstants.primaryColor),
                    fontSize: 10, fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
          const SizedBox(height: 2),
        ],
      ),
    );
  }
}

// ─── List tile ────────────────────────────────────────────────────────────────

class MangaListTile extends StatelessWidget {
  final MangaItem item;
  final VoidCallback? onTap;
  final void Function(String chapterUrl)? onChapterTap;

  const MangaListTile({super.key, required this.item, this.onTap, this.onChapterTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 5),
        color: const Color(AppConstants.cardColor),
        child: Row(
          children: [
            SizedBox(
              width: 80, height: 110,
              child: Image.network(
                AppConstants.proxyImage(item.thumbnail ?? ''),
                fit: BoxFit.cover,
                loadingBuilder: (_, child, progress) => progress == null
                    ? child
                    : Container(color: const Color(AppConstants.mutedColor)),
                errorBuilder: (_, __, ___) => Container(
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
                    Text(item.title, maxLines: 2, overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontFamily: AppConstants.fontFamily,
                          color: Color(AppConstants.textPrimary),
                          fontSize: 13, fontWeight: FontWeight.w700,
                        )),
                    const SizedBox(height: 6),
                    if (item.type != null)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        color: const Color(AppConstants.mangaBadgeRed),
                        child: Text(item.type!.toUpperCase(), style: const TextStyle(
                          fontFamily: AppConstants.fontFamily,
                          color: Colors.white, fontSize: 9, fontWeight: FontWeight.w700,
                        )),
                      ),
                    if (item.latestChapters.isNotEmpty) ...[
                      const SizedBox(height: 6),
                      ...item.latestChapters.take(2).map((ch) => GestureDetector(
                        onTap: onChapterTap != null && ch.url.isNotEmpty
                            ? () => onChapterTap!(ch.url) : null,
                        child: Container(
                          margin: const EdgeInsets.only(bottom: 3),
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
                          color: const Color(AppConstants.mutedColor),
                          child: Row(children: [
                            Expanded(child: Text(ch.chapter, maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  fontFamily: AppConstants.fontFamily,
                                  color: Color(AppConstants.textPrimary),
                                  fontSize: 11, fontWeight: FontWeight.w600,
                                ))),
                            if (ch.date != null)
                              Text(ch.date!, style: const TextStyle(
                                fontFamily: AppConstants.fontFamily,
                                color: Color(AppConstants.textSecondary), fontSize: 10,
                              )),
                          ]),
                        ),
                      )),
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
