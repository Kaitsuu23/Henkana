library manga_detail_data;

// /api/manga-detail?url=... response shape:
/// {
///   success: true,
///   data: {
///     title, thumbnail, altTitle, type, status,
///     firstChapterUrl,
///     info: { type, status, authors, released, ... },
///     genres: [{name, url}],
///     rating,
///     synopsis,
///     chapters: { total, list: [{number, title, url, date, views, isNew}] },
///     related: [{title, thumbnail, url, slug, badge}]
///   }
/// }

class MangaChapter {
  final String? number;
  final String title;
  final String url;
  final String? date;
  final String? views;
  final bool isNew;

  MangaChapter({
    this.number,
    required this.title,
    required this.url,
    this.date,
    this.views,
    this.isNew = false,
  });

  factory MangaChapter.fromJson(Map<String, dynamic> json) {
    return MangaChapter(
      number: json['number']?.toString(),
      title: json['title']?.toString() ??
          json['chapter']?.toString() ??
          json['name']?.toString() ??
          '',
      url: json['url']?.toString() ?? json['link']?.toString() ?? '',
      date: json['date']?.toString(),
      views: json['views']?.toString(),
      isNew: json['isNew'] == true,
    );
  }
}

class MangaDetailData {
  final String title;
  final String? thumbnail;
  final String? altTitle;
  final String? type;
  final String? status;
  final String? firstChapterUrl;
  final Map<String, dynamic> info;   // dynamic kv from .hc-info-row
  final List<Map<String, String>> genres; // [{name, url}]
  final String? rating;
  final String? synopsis;
  final int chapterTotal;
  final List<MangaChapter> chapters; // from chapters.list
  final List<Map<String, dynamic>> related;

  MangaDetailData({
    required this.title,
    this.thumbnail,
    this.altTitle,
    this.type,
    this.status,
    this.firstChapterUrl,
    this.info = const {},
    this.genres = const [],
    this.rating,
    this.synopsis,
    this.chapterTotal = 0,
    this.chapters = const [],
    this.related = const [],
  });

  factory MangaDetailData.fromJson(Map<String, dynamic> json) {
    // genres: [{name, url}]
    List<Map<String, String>> genres = [];
    final rawGenres = json['genres'];
    if (rawGenres is List) {
      for (final g in rawGenres) {
        if (g is Map<String, dynamic>) {
          genres.add({
            'name': g['name']?.toString() ?? '',
            'url': g['url']?.toString() ?? '',
          });
        } else if (g is String) {
          genres.add({'name': g, 'url': ''});
        }
      }
    }

    // info: dynamic map
    Map<String, dynamic> info = {};
    final rawInfo = json['info'];
    if (rawInfo is Map<String, dynamic>) info = rawInfo;

    // chapters: {total, list:[...]}
    int chapterTotal = 0;
    List<MangaChapter> chapters = [];
    final rawChaps = json['chapters'];
    if (rawChaps is Map<String, dynamic>) {
      chapterTotal = (rawChaps['total'] as num?)?.toInt() ?? 0;
      final list = rawChaps['list'];
      if (list is List) {
        chapters = list
            .whereType<Map<String, dynamic>>()
            .map(MangaChapter.fromJson)
            .toList();
      }
    }

    // related: [{title, thumbnail, url, slug, badge}]
    List<Map<String, dynamic>> related = [];
    final rawRel = json['related'];
    if (rawRel is List) {
      related = rawRel.whereType<Map<String, dynamic>>().toList();
    }

    // Strip emoji from type
    String? rawType = json['type']?.toString();
    if (rawType != null) {
      rawType = rawType.replaceAll(RegExp(r'[^\x00-\x7F]+'), '').trim();
      if (rawType.isEmpty) rawType = json['type']?.toString();
    }

    return MangaDetailData(
      title: json['title']?.toString() ?? '',
      thumbnail: json['thumbnail']?.toString() ??
          json['image']?.toString() ??
          json['cover']?.toString(),
      altTitle: json['altTitle']?.toString() ??
          json['alternativeTitle']?.toString(),
      type: rawType,
      status: json['status']?.toString(),
      firstChapterUrl: json['firstChapterUrl']?.toString(),
      info: info,
      genres: genres,
      rating: json['rating']?.toString(),
      synopsis: json['synopsis']?.toString() ??
          json['description']?.toString(),
      chapterTotal: chapterTotal,
      chapters: chapters,
      related: related,
    );
  }
}
