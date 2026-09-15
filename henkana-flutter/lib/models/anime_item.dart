// Standard anime card used by:
/// - /api/hentai, /api/jav, /api/uncensored, /api/2d  → data[]
/// - /api/home sections type:"anime"                  → data[]
/// - /api/home sections type:"anime-tabs"             → tabs[].data[]
/// - /api/genre/:slug                                 → data[]
/// - /api/detail related[]
/// - /api/daftar-series                               → data[]
///
/// Key fields from backend:
///   title, thumbnail, url, postId, lastEpisode, type, status, views
class AnimeItem {
  final String title;
  final String url;
  final String? thumbnail;
  final String? lastEpisode; // e.g. "Ep 3", "Episode JAV"
  final String? type;        // e.g. "Hentai", "JAV", "OVA"
  final String? status;      // e.g. "Ongoing", "Completed", "RAW", "Sub"
  final String? postId;
  final String? views;
  final String? rating;

  AnimeItem({
    required this.title,
    required this.url,
    this.thumbnail,
    this.lastEpisode,
    this.type,
    this.status,
    this.postId,
    this.views,
    this.rating,
  });

  factory AnimeItem.fromJson(Map<String, dynamic> json) {
    return AnimeItem(
      title: json['title']?.toString() ?? '',
      url: json['url']?.toString() ?? json['link']?.toString() ?? '',
      thumbnail: json['thumbnail']?.toString() ??
          json['image']?.toString() ??
          json['cover']?.toString(),
      lastEpisode: json['lastEpisode']?.toString() ??
          json['episode']?.toString() ??
          json['eps']?.toString(),
      type: json['type']?.toString(),
      status: json['status']?.toString(),
      postId: json['postId']?.toString(),
      views: json['views']?.toString(),
      rating: json['rating']?.toString() ?? json['score']?.toString(),
    );
  }

  // Convenience getter — returns clean episode label (strips "Ep " prefix)
  String? get episodeLabel => lastEpisode;
}
