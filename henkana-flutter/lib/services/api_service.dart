import 'package:dio/dio.dart';
import '../models/anime_item.dart';
import '../models/manga_item.dart';
import '../models/home_section.dart';
import '../models/detail_data.dart';
import '../models/watch_data.dart';
import '../models/manga_detail_data.dart';
import '../models/genre_item.dart';
import '../utils/constants.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  late final Dio _dio = Dio(
    BaseOptions(
      baseUrl: AppConstants.baseApiUrl,
      connectTimeout: const Duration(seconds: 40),
      receiveTimeout: const Duration(seconds: 45),
      sendTimeout: const Duration(seconds: 40),
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    ),
  )..interceptors.addAll([
      _RetryInterceptor(maxRetries: 3),
      LogInterceptor(
        request: false,
        requestHeader: false,
        responseHeader: false,
        error: true,
      ),
    ]);

  // ─── core helpers ────────────────────────────────────────────────────────────

  /// Raw GET — returns whatever Dio gives: Map, List, or primitive.
  Future<dynamic> _getRaw(
    String path, {
    Map<String, dynamic>? params,
  }) async {
    final res = await _dio.get(path, queryParameters: params);
    return res.data;
  }

  /// GET that always returns Map. If API returns List, wraps as {data: [...]}.
  Future<Map<String, dynamic>> _get(
    String path, {
    Map<String, dynamic>? params,
  }) async {
    final data = await _getRaw(path, params: params);
    if (data is Map<String, dynamic>) return data;
    if (data is List) return {'data': data};
    return {};
  }

  /// Extract the nested `data` Map from a response like {success, data: {...}}.
  Map<String, dynamic> _extractDataMap(Map<String, dynamic> json) {
    final inner = json['data'];
    if (inner is Map<String, dynamic>) return inner;
    return json;
  }

  List<T> _mapList<T>(
    dynamic raw,
    T Function(Map<String, dynamic>) mapper,
  ) {
    if (raw is List) {
      return raw.whereType<Map<String, dynamic>>().map(mapper).toList();
    }
    return [];
  }

  // ─── home ────────────────────────────────────────────────────────────────────

  /// Response: {success, source, totalSections, sections:[...]}
  Future<List<HomeSection>> fetchHome() async {
    final raw = await _getRaw('/home');

    List<dynamic>? list;
    if (raw is List) {
      list = raw;
    } else if (raw is Map<String, dynamic>) {
      // backend key is "sections"
      for (final key in ['sections', 'data', 'results', 'items']) {
        if (raw[key] is List) {
          list = raw[key] as List;
          break;
        }
      }
    }

    if (list == null || list.isEmpty) return [];
    return list
        .whereType<Map<String, dynamic>>()
        .map(HomeSection.fromJson)
        .toList();
  }

  // ─── anime listings ───────────────────────────────────────────────────────────

  /// /api/hentai, /api/uncensored, /api/jav, /api/2d
  /// Response: {success, page, totalPages, hasNextPage, ..., data:[AnimeItem]}
  Future<Map<String, dynamic>> fetchListing(
    String endpoint, {
    int page = 1,
  }) async {
    return await _get('/$endpoint', params: {'page': page});
  }

  Future<List<AnimeItem>> fetchListingItems(
    String endpoint, {
    int page = 1,
  }) async {
    final raw = await _getRaw('/$endpoint', params: {'page': page});
    if (raw is List) return _mapList(raw, AnimeItem.fromJson);
    if (raw is Map<String, dynamic>) {
      return _mapList(raw['data'] ?? raw['items'] ?? [], AnimeItem.fromJson);
    }
    return [];
  }

  Future<Map<String, dynamic>> fetchHentai({int page = 1}) =>
      fetchListing('hentai', page: page);
  Future<Map<String, dynamic>> fetchUncensored({int page = 1}) =>
      fetchListing('uncensored', page: page);
  Future<Map<String, dynamic>> fetchJav({int page = 1}) =>
      fetchListing('jav', page: page);
  Future<Map<String, dynamic>> fetchDoujinshi({int page = 1}) =>
      fetchListing('doujinshi', page: page);
  Future<Map<String, dynamic>> fetch2D({int page = 1}) =>
      fetchListing('2d', page: page);

  Future<List<AnimeItem>> fetchAnimeListRaw(
    String endpoint, {
    int page = 1,
  }) =>
      fetchListingItems(endpoint, page: page);

  // ─── manga listings ───────────────────────────────────────────────────────────

  /// /api/manga  → {success, page, totalSections, sections:[{section, data:[MangaItem]}]}
  Future<Map<String, dynamic>> fetchManga({int page = 1}) async {
    return await _get('/manga', params: {'page': page});
  }

  /// /api/manhwa → {success, page, totalPages, ..., data:[{title,thumbnail,url,slug,postId}]}
  Future<Map<String, dynamic>> fetchManhwa({int page = 1}) async {
    return await _get('/manhwa', params: {'page': page});
  }

  /// Flatten manga/manhwa endpoint into MangaItem list.
  Future<List<MangaItem>> fetchMangaListRaw(
    String endpoint, {
    int page = 1,
  }) async {
    final raw = await _getRaw('/$endpoint', params: {'page': page});
    if (raw is List) return _mapList(raw, MangaItem.fromJson);
    if (raw is Map<String, dynamic>) {
      // /api/manga wraps items in sections
      if (raw['sections'] is List) {
        final allItems = <MangaItem>[];
        for (final sec in raw['sections'] as List) {
          if (sec is! Map<String, dynamic>) continue;
          final data = sec['data'];
          if (data is List) {
            allItems.addAll(_mapList(data, MangaItem.fromJson));
          }
        }
        return allItems;
      }
      return _mapList(
          raw['data'] ?? raw['items'] ?? [], MangaItem.fromJson);
    }
    return [];
  }

  // ─── detail ──────────────────────────────────────────────────────────────────

  /// /api/detail?url=... → {success, data:{...DetailData}}
  Future<DetailData> fetchDetail(String url) async {
    final json = await _get('/detail', params: {'url': url});
    return DetailData.fromJson(_extractDataMap(json));
  }

  /// /api/manga-detail?url=... → {success, data:{...MangaDetailData}}
  Future<MangaDetailData> fetchMangaDetail(String url) async {
    final json = await _get('/manga-detail', params: {'url': url});
    return MangaDetailData.fromJson(_extractDataMap(json));
  }

  // ─── watch ───────────────────────────────────────────────────────────────────

  /// /api/watch?url=... → {success, data:{...WatchData, streams:[{quality,hlsUrl,...}]}}
  Future<WatchData> fetchWatch(String url) async {
    final json = await _get('/watch', params: {'url': url});
    return WatchData.fromJson(_extractDataMap(json));
  }

  /// /api/manga-read?url=... → {success, data:{pages:[...], navigation:{prev,next}}}
  Future<List<String>> fetchMangaRead(String url) async {
    final json = await _get('/manga-read', params: {'url': url});
    final data = _extractDataMap(json);
    final raw = data['pages'] ?? data['images'] ?? data['data'] ?? [];
    if (raw is List) return raw.map((e) => e.toString()).toList();
    return [];
  }

  // ─── genre ───────────────────────────────────────────────────────────────────

  /// /api/genre → {success, total, data:[{name, slug, url, count}]}
  Future<List<GenreItem>> fetchGenres({bool isManga = false}) async {
    // No manga genre list endpoint — use anime genre list for both
    final raw = await _getRaw('/genre');
    if (raw is Map<String, dynamic>) {
      return _mapList(raw['data'] ?? raw['genres'] ?? [], GenreItem.fromJson);
    }
    if (raw is List) return _mapList(raw, GenreItem.fromJson);
    return [];
  }

  /// /api/genre/:slug?page=N → {success, genre, page, total, pagination, data:[AnimeItem]}
  Future<Map<String, dynamic>> fetchGenreItems(
    String slug, {
    int page = 1,
    bool isManga = false,
  }) async {
    final endpoint = isManga ? '/manga-genre/$slug' : '/genre/$slug';
    return await _get(endpoint, params: {'page': page});
  }

  // ─── search ──────────────────────────────────────────────────────────────────

  /// /api/search?q=...&page=N → {success, query, page, totalPages, total, data:[AnimeItem]}
  Future<Map<String, dynamic>> search(String query, {int page = 1}) async {
    return await _get('/search', params: {'q': query, 'page': page});
  }

  // ─── series / daftar-series ───────────────────────────────────────────────────

  Future<Map<String, dynamic>> fetchDaftarSeries({
    int page = 1,
    String? status,
    String? type,
    String? order,
  }) async {
    final params = <String, dynamic>{'page': page};
    if (status != null) params['status'] = status;
    if (type != null) params['type'] = type;
    if (order != null) params['order'] = order;
    return await _get('/daftar-series', params: params);
  }

  Future<Map<String, dynamic>> fetchListMode({String? title}) async {
    final params = <String, dynamic>{};
    if (title != null) params['title'] = title;
    return await _get('/list-mode', params: params);
  }

  // ─── studio / producer ────────────────────────────────────────────────────────

  Future<Map<String, dynamic>> fetchStudio(String slug, {int page = 1}) async {
    return await _get('/studio/$slug', params: {'page': page});
  }

  Future<Map<String, dynamic>> fetchProducer(
    String slug, {
    int page = 1,
  }) async {
    return await _get('/producer/$slug', params: {'page': page});
  }

  // ─── sidebar / tooltip ───────────────────────────────────────────────────────

  Future<Map<String, dynamic>> fetchSidebar({String? url}) async {
    final params = url != null ? {'url': url} : null;
    return await _get('/sidebar', params: params);
  }

  Future<Map<String, dynamic>> fetchTooltip(String id) async {
    return await _get('/tooltip/$id');
  }
}

// ─── retry interceptor ────────────────────────────────────────────────────────

class _RetryInterceptor extends Interceptor {
  final int maxRetries;
  _RetryInterceptor({this.maxRetries = 3});

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    final attempt = (err.requestOptions.extra['_retry_count'] as int?) ?? 0;

    final shouldRetry = attempt < maxRetries &&
        (err.type == DioExceptionType.connectionTimeout ||
            err.type == DioExceptionType.receiveTimeout ||
            err.type == DioExceptionType.sendTimeout ||
            err.type == DioExceptionType.connectionError ||
            (err.response?.statusCode != null &&
                err.response!.statusCode! >= 500));

    if (!shouldRetry) return handler.next(err);

    // Exponential back-off: 1s, 2s, 4s
    await Future.delayed(Duration(seconds: 1 << attempt));
    err.requestOptions.extra['_retry_count'] = attempt + 1;

    try {
      final dio = Dio(BaseOptions(
        baseUrl: err.requestOptions.baseUrl,
        connectTimeout: const Duration(seconds: 40),
        receiveTimeout: const Duration(seconds: 45),
        sendTimeout: const Duration(seconds: 40),
        headers: err.requestOptions.headers,
      ));
      final response = await dio.fetch(err.requestOptions);
      return handler.resolve(response);
    } on DioException catch (e) {
      return handler.next(e);
    }
  }
}
