/// /api/genre  → data: [{name, slug, url, count}]
/// /api/studio → data: [{name, slug, url, count}]
class GenreItem {
  final String name;
  final String slug;
  final String? url;
  final int? count;

  GenreItem({
    required this.name,
    required this.slug,
    this.url,
    this.count,
  });

  factory GenreItem.fromJson(Map<String, dynamic> json) {
    return GenreItem(
      name: json['name']?.toString() ?? json['title']?.toString() ?? '',
      slug: json['slug']?.toString() ?? '',
      url: json['url']?.toString(),
      count: json['count'] != null
          ? int.tryParse(json['count'].toString())
          : null,
    );
  }
}
