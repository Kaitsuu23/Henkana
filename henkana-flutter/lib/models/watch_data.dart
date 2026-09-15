import '../utils/constants.dart';

// /api/watch?url=... — all hlsUrl auto-proxied via /api/proxy/hls
// so CDN Referer check is satisfied and video plays correctly.

class StreamQuality {
  final String quality;
  final String serverName;
  final String hlsUrl; // proxied

  StreamQuality({
    required this.quality,
    required this.serverName,
    required this.hlsUrl,
  });

  factory StreamQuality.fromJson(Map<String, dynamic> json) {
    final raw = json['hlsUrl']?.toString() ?? json['url']?.toString() ?? '';
    return StreamQuality(
      quality: json['quality']?.toString() ??
          json['label']?.toString() ??
          'Auto',
      serverName: json['serverName']?.toString() ?? '',
      // Proxy every HLS URL — CDN requires Referer: hentaicop.com
      hlsUrl: AppConstants.proxyHls(raw),
    );
  }
}

class WatchData {
  final String? title;
  final String? thumbnail;
  final String? seriesTitle;
  final String? seriesUrl;
  final List<StreamQuality> streams;
  final String? prevUrl;
  final String? nextUrl;

  WatchData({
    this.title,
    this.thumbnail,
    this.seriesTitle,
    this.seriesUrl,
    this.streams = const [],
    this.prevUrl,
    this.nextUrl,
  });

  factory WatchData.fromJson(Map<String, dynamic> json) {
    String? seriesTitle;
    String? seriesUrl;
    String? thumbnail;

    final series = json['series'];
    if (series is Map<String, dynamic>) {
      seriesTitle = series['title']?.toString();
      seriesUrl = series['url']?.toString();
      thumbnail = series['thumbnail']?.toString();
    }
    thumbnail ??=
        json['thumbnail']?.toString() ?? json['image']?.toString();

    List<StreamQuality> streams = [];
    final rawStreams = json['streams'];
    if (rawStreams is List) {
      streams = rawStreams
          .whereType<Map<String, dynamic>>()
          .where((s) => (s['hlsUrl']?.toString() ?? '').isNotEmpty)
          .map(StreamQuality.fromJson)
          .toList();
      streams.sort((a, b) => _qualityRank(b.quality).compareTo(_qualityRank(a.quality)));
      // Prefer 720p as default — 1080p on Android texture/emulator often garbles.
      // User can still pick 1080p (played via platform view).
      final i720 = streams.indexWhere((s) => _qualityRank(s.quality) == 720);
      if (i720 > 0) {
        final preferred = streams.removeAt(i720);
        streams.insert(0, preferred);
      }
    }

    String? prevUrl;
    String? nextUrl;
    final nav = json['navigation'];
    if (nav is Map<String, dynamic>) {
      prevUrl = nav['prev']?.toString();
      nextUrl = nav['next']?.toString();
    }

    return WatchData(
      title: json['title']?.toString(),
      thumbnail: thumbnail,
      seriesTitle: seriesTitle,
      seriesUrl: seriesUrl,
      streams: streams,
      prevUrl: prevUrl,
      nextUrl: nextUrl,
    );
  }
}

int _qualityRank(String quality) {
  final m = RegExp(r'(\d+)').firstMatch(quality);
  return int.tryParse(m?.group(1) ?? '') ?? 0;
}
