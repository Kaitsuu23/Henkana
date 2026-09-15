// Manga/manhwa card. Two different shapes from backend:
//
// Shape A — /api/manga sections (has latestChapters + type + typeUrl):
//   { title, thumbnail, url, type, typeUrl, views, score,
//     latestChapters:[{chapter, badge, url, date}] }
//
// Shape B — /api/manhwa, /api/doujinshi, /api/manga-genre/:slug (simpler):
//   { title, thumbnail, url, slug, postId }

class MangaChapterPreview {
  final String chapter; // e.g. "Chapter 42"
  final String? badge;  // e.g. "END"
  final String url;     // chapter reader URL
  final String? date;   // relative date

  const MangaChapterPreview({
    required this.chapter,
    this.badge,
    required this.url,
    this.date,
  });

  factory MangaChapterPreview.fromJson(Map<String, dynamic> json) {
    return MangaChapterPreview(
      chapter: json['chapter']?.toString() ??
          json['title']?.toString() ??
          json['name']?.toString() ??
          '',
      badge: json['badge']?.toString(),
      url: json['url']?.toString() ?? json['link']?.toString() ?? '',
      date: json['date']?.toString(),
    );
  }
}

class MangaItem {
  final String title;
  final String url;       // manga detail page URL
  final String? thumbnail;
  final String? type;     // e.g. "Manhwa", "Manga" (emoji stripped)
  final String? typeUrl;
  final String? status;
  final String? slug;
  final String? postId;
  final String? views;
  final String? score;

  // All chapters for chip rendering (up to 2 shown in card)
  final List<MangaChapterPreview> latestChapters;

  // Convenience getters
  String? get chapter => latestChapters.isNotEmpty ? latestChapters.first.chapter : null;
  String? get chapterUrl => latestChapters.isNotEmpty ? latestChapters.first.url : null;

  MangaItem({
    required this.title,
    required this.url,
    this.thumbnail,
    this.type,
    this.typeUrl,
    this.status,
    this.slug,
    this.postId,
    this.views,
    this.score,
    this.latestChapters = const [],
  });

  factory MangaItem.fromJson(Map<String, dynamic> json) {
    // ── latestChapters: [{chapter, badge, url, date}] ──
    List<MangaChapterPreview> chapters = [];
    final rawChaps = json['latestChapters'];
    if (rawChaps is List) {
      chapters = rawChaps
          .whereType<Map<String, dynamic>>()
          .map(MangaChapterPreview.fromJson)
          .toList();
    }

    // Strip emoji flags from type (e.g. "🇰🇷 Manhwa" → "Manhwa")
    String? rawType = json['type']?.toString();
    if (rawType != null) {
      rawType = rawType.replaceAll(RegExp(r'[^\x00-\x7F]+'), '').trim();
      if (rawType.isEmpty) rawType = json['type']?.toString();
    }

    return MangaItem(
      title: json['title']?.toString() ?? '',
      url: json['url']?.toString() ?? json['link']?.toString() ?? '',
      thumbnail: json['thumbnail']?.toString() ??
          json['image']?.toString() ??
          json['cover']?.toString(),
      type: rawType,
      typeUrl: json['typeUrl']?.toString(),
      status: json['status']?.toString(),
      slug: json['slug']?.toString(),
      postId: json['postId']?.toString(),
      views: json['views']?.toString(),
      score: json['score']?.toString(),
      latestChapters: chapters,
    );
  }
}
