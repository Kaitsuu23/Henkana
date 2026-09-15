import 'package:flutter/foundation.dart';
import '../models/anime_item.dart';
import '../models/manga_item.dart';
import '../models/genre_item.dart';
import '../services/api_service.dart';

enum LoadState { idle, loading, loaded, error }

// ─── Search provider ──────────────────────────────────────────────────────────

class SearchProvider extends ChangeNotifier {
  final ApiService _api = ApiService();

  LoadState _state = LoadState.idle;
  List<AnimeItem> _animeResults = [];
  List<MangaItem> _mangaResults = [];
  String _errorMessage = '';
  String _lastQuery = '';
  int _currentPage = 1;
  bool _hasMore = true;

  LoadState get state => _state;
  List<AnimeItem> get animeResults => _animeResults;
  List<MangaItem> get mangaResults => _mangaResults;
  String get errorMessage => _errorMessage;
  bool get isLoading => _state == LoadState.loading;
  bool get hasError => _state == LoadState.error;
  bool get hasMore => _hasMore;
  bool get isEmpty =>
      _state == LoadState.loaded &&
      _animeResults.isEmpty &&
      _mangaResults.isEmpty;

  Future<void> search(String query, {bool refresh = false}) async {
    final trimmed = query.trim();
    if (trimmed.isEmpty) {
      clear();
      return;
    }

    if (_state == LoadState.loading) return;

    if (refresh || trimmed != _lastQuery) {
      _currentPage = 1;
      _animeResults = [];
      _mangaResults = [];
      _hasMore = true;
      _lastQuery = trimmed;
    }

    if (!_hasMore) return;

    _state = LoadState.loading;
    notifyListeners();

    try {
      final json = await _api.search(trimmed, page: _currentPage);
      // /api/search → { success, query, page, totalPages, data: [AnimeItem] }
      final rawList = json['data'] ??
          json['anime'] ??
          json['animeResults'] ??
          json['results'] ??
          [];
      final rawManga = json['manga'] ?? json['mangaResults'] ?? [];
      final rawAnime = rawList;

      List<AnimeItem> newAnime = [];
      List<MangaItem> newManga = [];

      if (rawAnime is List) {
        newAnime = _asMaps(rawAnime).map(AnimeItem.fromJson).toList();
      }
      if (rawManga is List) {
        newManga = _asMaps(rawManga).map(MangaItem.fromJson).toList();
      }

      if (newAnime.isEmpty && newManga.isEmpty) {
        _hasMore = false;
      } else {
        _animeResults = [..._animeResults, ...newAnime];
        _mangaResults = [..._mangaResults, ...newManga];
        _currentPage++;
      }

      _state = LoadState.loaded;
      _errorMessage = '';
    } catch (e) {
      _state = LoadState.error;
      _errorMessage = _parseError(e);
    }

    notifyListeners();
  }

  Future<void> loadMore() {
    if (_lastQuery.isEmpty) return Future.value();
    return search(_lastQuery);
  }

  void clear() {
    _state = LoadState.idle;
    _animeResults = [];
    _mangaResults = [];
    _lastQuery = '';
    _currentPage = 1;
    _hasMore = true;
    _errorMessage = '';
    notifyListeners();
  }

  static List<Map<String, dynamic>> _asMaps(List raw) {
    return raw
        .whereType<Map>()
        .map((e) => Map<String, dynamic>.from(e))
        .toList();
  }

  String _parseError(Object e) {
    if (e is Exception) return e.toString().replaceFirst('Exception: ', '');
    return e.toString();
  }
}

// ─── Genre provider ───────────────────────────────────────────────────────────

class GenreProvider extends ChangeNotifier {
  final ApiService _api = ApiService();
  final bool isManga;

  GenreProvider({this.isManga = false});

  LoadState _state = LoadState.idle;
  List<GenreItem> _genres = [];
  String _errorMessage = '';

  LoadState get state => _state;
  List<GenreItem> get genres => _genres;
  String get errorMessage => _errorMessage;
  bool get isLoading => _state == LoadState.loading;
  bool get hasError => _state == LoadState.error;

  Future<void> fetchGenres({bool refresh = false}) async {
    if (_state == LoadState.loading) return;
    if (_state == LoadState.loaded && !refresh) return;

    _state = LoadState.loading;
    notifyListeners();

    try {
      _genres = await _api.fetchGenres(isManga: isManga);
      _state = LoadState.loaded;
      _errorMessage = '';
    } catch (e) {
      _state = LoadState.error;
      _errorMessage = _parseError(e);
    }

    notifyListeners();
  }

  String _parseError(Object e) {
    if (e is Exception) return e.toString().replaceFirst('Exception: ', '');
    return e.toString();
  }
}

// ─── Genre items provider ─────────────────────────────────────────────────────

class GenreItemsProvider extends ChangeNotifier {
  final ApiService _api = ApiService();

  LoadState _state = LoadState.idle;
  List<AnimeItem> _animeItems = [];
  List<MangaItem> _mangaItems = [];
  String _errorMessage = '';
  int _currentPage = 1;
  bool _hasMore = true;
  bool _isManga = false;

  LoadState get state => _state;
  List<AnimeItem> get animeItems => _animeItems;
  List<MangaItem> get mangaItems => _mangaItems;
  String get errorMessage => _errorMessage;
  bool get isLoading => _state == LoadState.loading;
  bool get hasError => _state == LoadState.error;
  bool get hasMore => _hasMore;

  Future<void> fetch(
    String slug, {
    bool isManga = false,
    bool refresh = false,
  }) async {
    if (_state == LoadState.loading) return;

    if (refresh) {
      _currentPage = 1;
      _animeItems = [];
      _mangaItems = [];
      _hasMore = true;
      _isManga = isManga;
    }

    if (!_hasMore) return;

    _state = LoadState.loading;
    notifyListeners();

    try {
      final json = await _api.fetchGenreItems(
        slug,
        page: _currentPage,
        isManga: isManga,
      );
      final raw =
          json['data'] ?? json['items'] ?? json['results'] ?? [];

      if (raw is List && raw.isEmpty) {
        _hasMore = false;
      } else if (raw is List) {
        if (isManga) {
          final newItems = raw
              .whereType<Map<String, dynamic>>()
              .map(MangaItem.fromJson)
              .toList();
          _mangaItems = refresh ? newItems : [..._mangaItems, ...newItems];
        } else {
          final newItems = raw
              .whereType<Map<String, dynamic>>()
              .map(AnimeItem.fromJson)
              .toList();
          _animeItems = refresh ? newItems : [..._animeItems, ...newItems];
        }
        _currentPage++;
      }

      _state = LoadState.loaded;
      _errorMessage = '';
    } catch (e) {
      _state = LoadState.error;
      _errorMessage = _parseError(e);
    }

    notifyListeners();
  }

  Future<void> loadMore(String slug) => fetch(slug, isManga: _isManga);

  String _parseError(Object e) {
    if (e is Exception) return e.toString().replaceFirst('Exception: ', '');
    return e.toString();
  }
}
