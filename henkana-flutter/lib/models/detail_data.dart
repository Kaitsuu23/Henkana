library detail_data;

// /api/detail?url=... response shape:
/// {
///   success: true,
///   data: {
///     title, thumbnail, description,
///     alternativeTitles: string[],
///     genres: [{name, url}],
///     status, type, censor, released,
///     studios:  [{name, url}],
///     director: [{name, url}],
///     casts:    [{name, url}],
///     episodes: { total, list: [{number, title, url, date, sub}] },
///     related:  [{title, thumbnail, url, postId, type, status}]
///   }
/// }

class NamedLink {
  final String name;
  final String? url;
  NamedLink({required this.name, this.url});

  factory NamedLink.fromJson(Map<String, dynamic> json) {
    return NamedLink(
      name: json['name']?.toString() ?? '',
      url: json['url']?.toString(),
    );
  }

  static List<NamedLink> listFromJson(dynamic raw) {
    if (raw == null) return [];
    if (raw is List) {
      return raw.whereType<Map<String, dynamic>>().map(NamedLink.fromJson).toList();
    }
    if (raw is String && raw.isNotEmpty) return [NamedLink(name: raw)];
    return [];
  }

  static List<String> namesFrom(dynamic raw) =>
      listFromJson(raw).map((e) => e.name).toList();
}

class Episode {
  final String? number;
  final String title;
  final String url;
  final String? date;
  final String? sub;
  final String? thumbnail;

  Episode({
    this.number,
    required this.title,
    required this.url,
    this.date,
    this.sub,
    this.thumbnail,
  });

  factory Episode.fromJson(Map<String, dynamic> json) {
    return Episode(
      number: json['number']?.toString(),
      title: json['title']?.toString() ?? json['episode']?.toString() ?? '',
      url: json['url']?.toString() ?? json['link']?.toString() ?? '',
      date: json['date']?.toString(),
      sub: json['sub']?.toString(),
      thumbnail: json['thumbnail']?.toString() ?? json['image']?.toString(),
    );
  }
}

class DetailData {
  final String title;
  final String? thumbnail;
  final String? description;        // "description" from backend
  final List<String> alternativeTitles;
  final List<NamedLink> genres;
  final String? status;
  final String? type;
  final String? censor;
  final String? released;
  final List<NamedLink> studios;
  final List<NamedLink> directors;
  final List<NamedLink> casts;
  final int episodeTotal;
  final List<Episode> episodes;     // from episodes.list
  final List<Map<String, dynamic>> related;

  DetailData({
    required this.title,
    this.thumbnail,
    this.description,
    this.alternativeTitles = const [],
    this.genres = const [],
    this.status,
    this.type,
    this.censor,
    this.released,
    this.studios = const [],
    this.directors = const [],
    this.casts = const [],
    this.episodeTotal = 0,
    this.episodes = const [],
    this.related = const [],
  });

  // Convenience — synopsis alias
  String? get synopsis => description;

  factory DetailData.fromJson(Map<String, dynamic> json) {
    // alternativeTitles: string[]
    List<String> altTitles = [];
    final rawAlt = json['alternativeTitles'];
    if (rawAlt is List) {
      altTitles = rawAlt.map((e) => e.toString()).toList();
    } else if (rawAlt is String && rawAlt.isNotEmpty) {
      altTitles = [rawAlt];
    }

    // genres: [{name, url}]
    final genres = NamedLink.listFromJson(json['genres']);

    // studios / director / casts: [{name, url}]
    final studios = NamedLink.listFromJson(json['studios']);
    final directors = NamedLink.listFromJson(json['director']);
    final casts = NamedLink.listFromJson(json['casts']);

    // episodes: { total, list: [...] }
    int episodeTotal = 0;
    List<Episode> episodes = [];
    final rawEps = json['episodes'];
    if (rawEps is Map<String, dynamic>) {
      episodeTotal = (rawEps['total'] as num?)?.toInt() ?? 0;
      final list = rawEps['list'];
      if (list is List) {
        episodes = list
            .whereType<Map<String, dynamic>>()
            .map(Episode.fromJson)
            .toList();
      }
    }

    // related: [{title, thumbnail, url, postId, type, status}]
    List<Map<String, dynamic>> related = [];
    final rawRel = json['related'];
    if (rawRel is List) {
      related = rawRel.whereType<Map<String, dynamic>>().toList();
    }

    return DetailData(
      title: json['title']?.toString() ?? '',
      thumbnail: json['thumbnail']?.toString() ??
          json['image']?.toString() ??
          json['cover']?.toString(),
      description: json['description']?.toString() ??
          json['synopsis']?.toString(),
      alternativeTitles: altTitles,
      genres: genres,
      status: json['status']?.toString(),
      type: json['type']?.toString(),
      censor: json['censor']?.toString(),
      released: json['released']?.toString(),
      studios: studios,
      directors: directors,
      casts: casts,
      episodeTotal: episodeTotal,
      episodes: episodes,
      related: related,
    );
  }
}
