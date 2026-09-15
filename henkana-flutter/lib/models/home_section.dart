import 'anime_item.dart';
import 'manga_item.dart';

/// /api/home response:
/// {
///   success, source, totalSections,
///   sections: [
///     { section, type:"anime", data:[AnimeItem] }
///     { section, type:"manga", data:[MangaItem] }
///     { section, type:"anime-tabs", tabs:[{tab, data:[AnimeItem]}] }
///   ]
/// }
class HomeSection {
  final String title;          // from "section" key
  final String type;           // "anime" | "manga" | "anime-tabs"
  final List<AnimeItem> animeItems;
  final List<MangaItem> mangaItems;
  final Map<String, List<AnimeItem>> tabItems; // for anime-tabs

  HomeSection({
    required this.title,
    required this.type,
    this.animeItems = const [],
    this.mangaItems = const [],
    this.tabItems = const {},
  });

  factory HomeSection.fromJson(Map<String, dynamic> json) {
    // Backend uses "section" as the title key
    final title = json['section']?.toString() ??
        json['title']?.toString() ??
        json['heading']?.toString() ??
        '';
    final type = json['type']?.toString() ?? 'anime';

    List<AnimeItem> animeItems = [];
    List<MangaItem> mangaItems = [];
    Map<String, List<AnimeItem>> tabItems = {};

    if (type == 'anime-tabs') {
      // tabs: [ {tab: "Hentai", data: [...]} ]
      final rawTabs = json['tabs'];
      if (rawTabs is List) {
        for (final t in rawTabs) {
          if (t is! Map<String, dynamic>) continue;
          final tabName =
              t['tab']?.toString() ?? t['name']?.toString() ?? '';
          final tabData = t['data'] ?? t['items'] ?? [];
          if (tabData is List) {
            tabItems[tabName] = tabData
                .whereType<Map<String, dynamic>>()
                .map(AnimeItem.fromJson)
                .toList();
          }
        }
      }
    } else if (type == 'manga') {
      final raw = json['data'] ?? json['items'] ?? [];
      if (raw is List) {
        mangaItems = raw
            .whereType<Map<String, dynamic>>()
            .map(MangaItem.fromJson)
            .toList();
      }
    } else {
      // type == "anime" (default)
      final raw = json['data'] ?? json['items'] ?? [];
      if (raw is List) {
        animeItems = raw
            .whereType<Map<String, dynamic>>()
            .map(AnimeItem.fromJson)
            .toList();
      }
    }

    return HomeSection(
      title: title,
      type: type,
      animeItems: animeItems,
      mangaItems: mangaItems,
      tabItems: tabItems,
    );
  }
}
